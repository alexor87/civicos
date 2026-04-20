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
let integrationData: any = null

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'tenant_integrations') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(() => Promise.resolve({ data: integrationData })),
              }),
            }),
          }),
        }
      }
      if (table === 'email_campaign_recipients') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockImplementation(() => Promise.resolve({ data: recipientData })),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }
    },
    rpc: mockRpc,
  }),
}))

import { POST } from '@/app/api/webhooks/resend/[tenantId]/route'

function makeRequest() {
  return new Request('http://localhost/api/webhooks/resend/tenant-123', {
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

const defaultParams = Promise.resolve({ tenantId: 'tenant-123' })

describe('POST /api/webhooks/resend/[tenantId]', () => {
  beforeEach(() => {
    mockVerify.mockReset()
    mockRpc.mockReset()

    vi.stubEnv('RESEND_WEBHOOK_SECRET', 'whsec_fallback')

    // Tenant has webhook secret configured
    integrationData = { resend_webhook_secret: 'encrypted_secret' }
    mockRpc.mockImplementation((fn: string) => {
      if (fn === 'decrypt_integration_key') {
        return Promise.resolve({ data: 'whsec_tenant_secret' })
      }
      return Promise.resolve({ error: null })
    })

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
  })

  it('returns 500 when no secret is available', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', '')
    integrationData = null
    const res = await POST(makeRequest() as any, { params: defaultParams })
    expect(res.status).toBe(500)
  })

  it('falls back to env var when tenant has no secret', async () => {
    integrationData = null
    const res = await POST(makeRequest() as any, { params: defaultParams })
    expect(res.status).toBe(200)
  })

  it('uses tenant secret from DB when available', async () => {
    const res = await POST(makeRequest() as any, { params: defaultParams })
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('decrypt_integration_key', {
      encrypted: 'encrypted_secret',
    })
  })

  it('returns 401 when signature is invalid', async () => {
    mockVerify.mockImplementation(() => { throw new Error('bad sig') })
    const res = await POST(makeRequest() as any, { params: defaultParams })
    expect(res.status).toBe(401)
  })

  it('skips unknown event types', async () => {
    mockVerify.mockReturnValue({ type: 'email.unknown', data: { email_id: 'x' } })
    const res = await POST(makeRequest() as any, { params: defaultParams })
    const json = await res.json()
    expect(json).toEqual({ ok: true, skipped: true })
  })

  it('skips when recipient not found', async () => {
    recipientData = null
    const res = await POST(makeRequest() as any, { params: defaultParams })
    const json = await res.json()
    expect(json).toEqual({ ok: true, skipped: true })
  })

  it('processes delivered event and increments counter', async () => {
    const res = await POST(makeRequest() as any, { params: defaultParams })
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
    const res = await POST(makeRequest() as any, { params: defaultParams })
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(mockRpc).not.toHaveBeenCalledWith('increment_email_campaign_counter', expect.anything())
  })

  it('handles opened event correctly', async () => {
    mockVerify.mockReturnValue({ type: 'email.opened', data: { email_id: 'resend_123' } })
    const res = await POST(makeRequest() as any, { params: defaultParams })
    expect(res.status).toBe(200)
    expect(mockRpc).toHaveBeenCalledWith('increment_email_campaign_counter', {
      p_campaign_id: 'camp-1',
      p_column: 'opened_count',
    })
  })
})
