import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/webhooks/visits/route'
import { NextRequest } from 'next/server'

global.fetch = vi.fn()

const WEBHOOK_SECRET = 'test-secret'
const SUPABASE_URL = 'https://test.supabase.co'

beforeEach(() => {
  vi.resetAllMocks()
  process.env.SUPABASE_WEBHOOK_SECRET = WEBHOOK_SECRET
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
})

function makeRequest(body: object, secret?: string): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': secret ?? WEBHOOK_SECRET,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/webhooks/visits', () => {
  it('returns 401 if secret is missing', async () => {
    const req = makeRequest({ type: 'UPDATE', record: {} }, '')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 if secret is wrong', async () => {
    const req = makeRequest({ type: 'UPDATE', record: {} }, 'bad-secret')
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 500 if SUPABASE_SERVICE_ROLE_KEY is not set', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const req = makeRequest({ type: 'UPDATE', record: { id: '1', result: 'no_home' } })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 400 if record is null', async () => {
    const req = makeRequest({ type: 'UPDATE', record: null })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': WEBHOOK_SECRET },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('ignores INSERT events and returns 200', async () => {
    const req = makeRequest({ type: 'INSERT', record: { id: '1', result: 'no_home' } })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('ignores UPDATE with non-triggering result', async () => {
    const req = makeRequest({ type: 'UPDATE', record: { id: '1', result: 'positive' } })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('calls agent-canvass-followup on UPDATE with result=no_home', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true })
    const visit = { id: '1', result: 'no_home', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'UPDATE', record: visit })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith(
      `${SUPABASE_URL}/functions/v1/agent-canvass-followup`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer service-key',
        }),
        body: JSON.stringify({ record: visit }),
      })
    )
  })

  it('calls agent-canvass-followup on UPDATE with result=follow_up', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true })
    const visit = { id: '2', result: 'follow_up', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'UPDATE', record: visit })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalledWith(
      `${SUPABASE_URL}/functions/v1/agent-canvass-followup`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ record: visit }),
      })
    )
  })

  it('returns 502 if Edge Function returns error status', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 500 })
    const visit = { id: '3', result: 'no_home', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'UPDATE', record: visit })
    const res = await POST(req)
    expect(res.status).toBe(502)
  })

  it('returns 500 if Edge Function call throws', async () => {
    ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'))
    const visit = { id: '3', result: 'no_home', tenant_id: 't1', campaign_id: 'c1' }
    const req = makeRequest({ type: 'UPDATE', record: visit })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
