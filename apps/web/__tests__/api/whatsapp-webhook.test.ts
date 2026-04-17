import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockIntegrationQuery,
  mockContactQuery,
  mockConvInsert,
  mockChatbotQuery,
  mockTwilioCreate,
  mockValidateRequest,
  mockCallAI,
  mockAdminRpc,
} = vi.hoisted(() => ({
  mockGetUser:         vi.fn().mockResolvedValue({ data: { user: null } }),
  mockIntegrationQuery: vi.fn(),
  mockContactQuery:    vi.fn(),
  mockConvInsert:      vi.fn().mockResolvedValue({ error: null }),
  mockChatbotQuery:    vi.fn(),
  mockTwilioCreate:    vi.fn().mockResolvedValue({ sid: 'SM_reply' }),
  mockValidateRequest: vi.fn().mockReturnValue(true),
  mockCallAI: vi.fn().mockResolvedValue({
    content: 'Hola, ¿en qué te puedo ayudar?',
  }),
  mockAdminRpc: vi.fn().mockResolvedValue({ data: 'decrypted_token' }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'tenant_integrations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: mockIntegrationQuery,
              })),
            })),
          })),
        }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                is: vi.fn(() => ({ single: mockContactQuery })),
              })),
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

vi.mock('@/lib/ai/call-ai', () => ({
  callAI: mockCallAI,
  AiNotConfiguredError: class extends Error { constructor(msg: string) { super(msg); this.name = 'AiNotConfiguredError' } },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    rpc: mockAdminRpc,
  })),
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

const validIntegration = {
  id: 'int1',
  tenant_id: 't1',
  campaign_id: 'camp1',
  twilio_sid: 'ACtest',
  twilio_token: 'encrypted_token',
  twilio_whatsapp_from: '+14155238886',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockValidateRequest.mockReturnValue(true)
  mockTwilioCreate.mockResolvedValue({ sid: 'SM_reply' })
  mockCallAI.mockResolvedValue({
    content: 'Hola, ¿en qué te puedo ayudar?',
  })
  mockConvInsert.mockResolvedValue({ error: null })
})

describe('POST /api/webhooks/whatsapp', () => {
  it('returns empty TwiML when no campaign matches the To number', async () => {
    mockIntegrationQuery.mockResolvedValue({ data: null })
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
    mockIntegrationQuery.mockResolvedValue({ data: validIntegration })
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
    mockIntegrationQuery.mockResolvedValue({ data: validIntegration })
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
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('calls Claude and sends reply when chatbot is enabled', async () => {
    mockIntegrationQuery.mockResolvedValue({ data: validIntegration })
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
    expect(mockCallAI).toHaveBeenCalledTimes(1)
    expect(mockTwilioCreate).toHaveBeenCalledTimes(1)
    expect(mockConvInsert).toHaveBeenCalledTimes(2) // inbound + outbound
  })
})
