import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockCampaignQuery,
  mockContactQuery,
  mockConvInsert,
  mockChatbotQuery,
  mockTwilioCreate,
  mockValidateRequest,
  mockAnthropicCreate,
} = vi.hoisted(() => ({
  mockGetUser:         vi.fn().mockResolvedValue({ data: { user: null } }),
  mockCampaignQuery:   vi.fn(),
  mockContactQuery:    vi.fn(),
  mockConvInsert:      vi.fn().mockResolvedValue({ error: null }),
  mockChatbotQuery:    vi.fn(),
  mockTwilioCreate:    vi.fn().mockResolvedValue({ sid: 'SM_reply' }),
  mockValidateRequest: vi.fn().mockReturnValue(true),
  mockAnthropicCreate: vi.fn().mockResolvedValue({
    content: [{ type: 'text', text: 'Hola, ¿en qué te puedo ayudar?' }],
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockCampaignQuery })),
          })),
        }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ single: mockContactQuery })),
            })),
          })),
        }
      }
      if (table === 'whatsapp_conversations') {
        return { insert: vi.fn(mockConvInsert) }
      }
      if (table === 'whatsapp_chatbot_config') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockChatbotQuery })),
          })),
        }
      }
      return {}
    }),
  })),
}))

vi.mock('twilio', () => ({
  default: Object.assign(
    vi.fn(() => ({ messages: { create: mockTwilioCreate } })),
    { validateRequest: mockValidateRequest }
  ),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockAnthropicCreate }
  },
}))

import { POST } from '@/app/api/webhooks/whatsapp/route'

function makeTwilioBody(params: Record<string, string>) {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

function makeRequest(body: string) {
  return new NextRequest('http://localhost/api/webhooks/whatsapp', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-twilio-signature': 'test-signature',
    },
  })
}

const validCampaign = {
  id: 'camp1',
  tenant_id: 't1',
  twilio_sid: 'ACtest',
  twilio_token: 'token123',
  twilio_whatsapp_from: '+14155238886',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockValidateRequest.mockReturnValue(true)
  mockTwilioCreate.mockResolvedValue({ sid: 'SM_reply' })
  mockAnthropicCreate.mockResolvedValue({
    content: [{ type: 'text', text: 'Hola, ¿en qué te puedo ayudar?' }],
  })
  mockConvInsert.mockResolvedValue({ error: null })
})

describe('POST /api/webhooks/whatsapp', () => {
  it('returns empty TwiML when no campaign matches the To number', async () => {
    mockCampaignQuery.mockResolvedValue({ data: null })
    const body = makeTwilioBody({
      From: 'whatsapp:+573001234567',
      To:   'whatsapp:+19999999999',
      Body: 'Hola',
      MessageSid: 'SM_in1',
    })
    const res  = await POST(makeRequest(body))
    const text = await res.text()
    expect(text).toBe('<Response/>')
  })

  it('returns 403 when Twilio signature is invalid', async () => {
    mockCampaignQuery.mockResolvedValue({ data: validCampaign })
    mockValidateRequest.mockReturnValue(false)
    const body = makeTwilioBody({
      From: 'whatsapp:+573001234567',
      To:   'whatsapp:+14155238886',
      Body: 'Hola',
      MessageSid: 'SM_in1',
    })
    const res = await POST(makeRequest(body))
    expect(res.status).toBe(403)
  })

  it('stores inbound message and returns empty TwiML when chatbot disabled', async () => {
    mockCampaignQuery.mockResolvedValue({ data: validCampaign })
    mockContactQuery.mockResolvedValue({ data: { id: 'ct1' } })
    mockChatbotQuery.mockResolvedValue({ data: { enabled: false } })
    const body = makeTwilioBody({
      From: 'whatsapp:+573001234567',
      To:   'whatsapp:+14155238886',
      Body: 'Hola me interesa',
      MessageSid: 'SM_in1',
    })
    const res  = await POST(makeRequest(body))
    const text = await res.text()
    expect(text).toBe('<Response/>')
    expect(mockConvInsert).toHaveBeenCalledTimes(1)
    expect(mockAnthropicCreate).not.toHaveBeenCalled()
  })

  it('calls Claude and sends reply when chatbot is enabled', async () => {
    mockCampaignQuery.mockResolvedValue({ data: validCampaign })
    mockContactQuery.mockResolvedValue({ data: { id: 'ct1' } })
    mockChatbotQuery.mockResolvedValue({
      data: {
        enabled:          true,
        system_prompt:    'Eres un asistente de campaña',
        fallback_message: 'Sin respuesta disponible',
      },
    })
    const body = makeTwilioBody({
      From: 'whatsapp:+573001234567',
      To:   'whatsapp:+14155238886',
      Body: '¿Cuáles son las propuestas?',
      MessageSid: 'SM_in2',
    })
    const res  = await POST(makeRequest(body))
    const text = await res.text()
    expect(text).toContain('<Message>')
    expect(mockAnthropicCreate).toHaveBeenCalledTimes(1)
    expect(mockTwilioCreate).toHaveBeenCalledTimes(1)
    expect(mockConvInsert).toHaveBeenCalledTimes(2) // inbound + outbound
  })
})
