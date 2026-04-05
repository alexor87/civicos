import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()
vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend }
  },
}))

import { sendVerificationEmail } from '@/lib/email/send-verification-email'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.RESEND_API_KEY = 'test-key'
  delete process.env.EMAIL_FROM
})

describe('sendVerificationEmail', () => {
  it('returns error when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY
    const res = await sendVerificationEmail({ email: 'a@b.co', actionLink: 'https://x' })
    expect(res.ok).toBe(false)
  })

  it('calls Resend with correct from/to/subject and embeds actionLink in html', async () => {
    mockSend.mockResolvedValueOnce({ data: { id: 'xyz' }, error: null })

    const res = await sendVerificationEmail({
      email: 'user@org.co',
      actionLink: 'https://confirm.example/token=xyz',
    })

    expect(res.ok).toBe(true)
    expect(mockSend).toHaveBeenCalledTimes(1)
    const args = mockSend.mock.calls[0][0]
    expect(args.to).toBe('user@org.co')
    expect(args.from).toContain('scrutix.co')
    expect(args.subject).toMatch(/confirma/i)
    expect(args.html).toContain('https://confirm.example/token=xyz')
  })

  it('honors EMAIL_FROM override', async () => {
    process.env.EMAIL_FROM = 'Custom <hi@example.com>'
    mockSend.mockResolvedValueOnce({ data: { id: 'xyz' }, error: null })

    await sendVerificationEmail({ email: 'user@org.co', actionLink: 'https://x' })

    expect(mockSend.mock.calls[0][0].from).toBe('Custom <hi@example.com>')
  })

  it('returns error when Resend returns an error', async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: 'domain not verified' } })

    const res = await sendVerificationEmail({ email: 'a@b.co', actionLink: 'https://x' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toMatch(/domain/i)
  })
})
