import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockVerify = vi.fn()

vi.mock('svix', () => {
  return {
    Webhook: class {
      verify(...args: any[]) { return mockVerify(...args) }
    },
  }
})

const mockRpc = vi.fn()
let recipientData: any = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => Promise.resolve({ data: recipientData })),
        }),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
    rpc: mockRpc,
  }),
}))

import { POST } from '@/app/api/webhooks/resend/route'

function makeRequest() {
  return new Request('http://localhost/api/webhooks/resend', {
    method: 'POST',
    body: JSON.stringify({}),
    headers: {
      'Content-Type': 'application/json',
      'svix-id': 'msg_123',
      'svix-timestamp': '1234567890',
      'svix-signature': 'v1_sig',
    },
  })
}

describe('POST /api/webhooks/resend', () => {
  beforeEach(() => {
    mockVerify.mockReset()
    mockRpc.mockReset()

    vi.stubEnv('RESEND_WEBHOOK_SECRET', 'whsec_test')

    mockVerify.mockReturnValue({
      type: 'email.delivered',
      data: { email_id: 'resend_123' },
    })

    recipientData = {
      id: 'rec-1',
      email_campaign_id: 'camp-1',
      delivered_at: null,
      opened_at: null,
      clicked_at: null,
      bounced_at: null,
    }

    mockRpc.mockResolvedValue({ error: null })
  })

  it('returns 500 when webhook secret is not configured', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', '')
    const res = await POST(makeRequest() as any)
    expect(res.status).toBe(500)
  })

  it('returns 401 when signature is invalid', async () => {
    mockVerify.mockImplementation(() => { throw new Error('bad sig') })
    const res = await POST(makeRequest() as any)
    expect(res.status).toBe(401)
  })

  it('skips unknown event types', async () => {
    mockVerify.mockReturnValue({ type: 'email.unknown', data: { email_id: 'x' } })
    const res = await POST(makeRequest() as any)
    const json = await res.json()
    expect(json).toEqual({ ok: true, skipped: true })
  })

  it('skips when recipient not found', async () => {
    recipientData = null
    const res = await POST(makeRequest() as any)
    const json = await res.json()
    expect(json).toEqual({ ok: true, skipped: true })
  })

  it('processes delivered event and increments counter', async () => {
    const res = await POST(makeRequest() as any)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(mockRpc).toHaveBeenCalledWith('increment_email_campaign_counter', {
      p_campaign_id: 'camp-1',
      p_column: 'delivered_count',
    })
  })

  it('does not increment counter when event already tracked', async () => {
    recipientData = {
      id: 'rec-1',
      email_campaign_id: 'camp-1',
      delivered_at: '2026-01-01T00:00:00Z',
      opened_at: null,
      clicked_at: null,
      bounced_at: null,
    }
    const res = await POST(makeRequest() as any)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('handles opened event correctly', async () => {
    mockVerify.mockReturnValue({ type: 'email.opened', data: { email_id: 'resend_123' } })
    const res = await POST(makeRequest() as any)
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('increment_email_campaign_counter', {
      p_campaign_id: 'camp-1',
      p_column: 'opened_count',
    })
  })
})
