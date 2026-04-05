import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockGenerateLink = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(async () => ({
    auth: { admin: { generateLink: mockGenerateLink } },
  })),
}))

const mockSendVerificationEmail = vi.fn()
vi.mock('@/lib/email/send-verification-email', () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
}))

import { POST } from '@/app/api/auth/resend-verification/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGenerateLink.mockResolvedValue({
    data: { properties: { action_link: 'https://test.supabase.co/verify?token=abc' } },
    error: null,
  })
  mockSendVerificationEmail.mockResolvedValue({ ok: true })
})

describe('POST /api/auth/resend-verification', () => {
  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 200 and sends email on happy path', async () => {
    // Use unique email to avoid rate limit from previous tests
    const res = await POST(makeRequest({ email: 'happy1@example.com' }))
    expect(res.status).toBe(200)
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'magiclink', email: 'happy1@example.com' })
    )
    expect(mockSendVerificationEmail).toHaveBeenCalledWith({
      email: 'happy1@example.com',
      actionLink: 'https://test.supabase.co/verify?token=abc',
    })
  })

  it('returns 404 when generateLink fails', async () => {
    mockGenerateLink.mockResolvedValueOnce({
      data: null,
      error: { message: 'User not found' },
    })

    const res = await POST(makeRequest({ email: 'missing@example.com' }))
    expect(res.status).toBe(404)
  })

it('returns 500 with specific error when Resend send fails', async () => {
    mockSendVerificationEmail.mockResolvedValueOnce({ ok: false, error: 'down' })

    const res = await POST(makeRequest({ email: 'fail@example.com' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('down')
  })

  it('returns 429 when reattempting before cooldown expires', async () => {
    const email = 'cooldown@example.com'
    const first = await POST(makeRequest({ email }))
    expect(first.status).toBe(200)

    const second = await POST(makeRequest({ email }))
    expect(second.status).toBe(429)
    const body = await second.json()
    expect(body.error).toMatch(/espera/i)
  })
})
