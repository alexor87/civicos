import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSend = vi.fn()

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend }
  },
}))

const ORIGINAL_ENV = process.env

beforeEach(() => {
  vi.clearAllMocks()
  process.env = { ...ORIGINAL_ENV, RESEND_API_KEY: 'test-key' }
  mockSend.mockResolvedValue({ data: { id: 'msg_123' }, error: null })
})

afterEach(() => {
  process.env = ORIGINAL_ENV
})

describe('sendInviteEmail', () => {
  it('sends an invitation with the invitaciones@ sender by default', async () => {
    const { sendInviteEmail } = await import('@/lib/email/transactional')

    const result = await sendInviteEmail({
      to: 'maria@test.com',
      inviteeName: 'María',
      inviterName: 'Alex',
      campaignName: 'Campaña Bogotá',
      role: 'volunteer',
      actionLink: 'https://app.scrutix.co/invite?token=abc',
    })

    expect(result).toEqual({ ok: true, id: 'msg_123' })
    expect(mockSend).toHaveBeenCalledTimes(1)
    const call = mockSend.mock.calls[0][0]
    expect(call.from).toBe('Scrutix <invitaciones@scrutix.co>')
    expect(call.to).toBe('maria@test.com')
    expect(call.subject).toContain('Campaña Bogotá')
    expect(call.html).toContain('María')
    expect(call.html).toContain('Alex')
    expect(call.html).toContain('https://app.scrutix.co/invite?token=abc')
  })

  it('uses custom EMAIL_FROM_INVITES when configured', async () => {
    process.env.EMAIL_FROM_INVITES = 'Custom <hello@example.com>'
    const { sendInviteEmail } = await import('@/lib/email/transactional')

    await sendInviteEmail({
      to: 'x@test.com',
      inviteeName: 'X',
      inviterName: 'Y',
      campaignName: 'Z',
      role: 'volunteer',
      actionLink: 'https://x.com',
    })

    expect(mockSend.mock.calls[0][0].from).toBe('Custom <hello@example.com>')
  })

  it('returns error when RESEND_API_KEY is missing', async () => {
    delete process.env.RESEND_API_KEY
    vi.resetModules()
    const { sendInviteEmail } = await import('@/lib/email/transactional')

    const result = await sendInviteEmail({
      to: 'x@test.com',
      inviteeName: 'X',
      inviterName: 'Y',
      campaignName: 'Z',
      role: 'volunteer',
      actionLink: 'https://x.com',
    })

    expect(result).toEqual({ ok: false, error: 'Email service not configured' })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('propagates Resend errors', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Domain not verified' },
    })
    const { sendInviteEmail } = await import('@/lib/email/transactional')

    const result = await sendInviteEmail({
      to: 'x@test.com',
      inviteeName: 'X',
      inviterName: 'Y',
      campaignName: 'Z',
      role: 'volunteer',
      actionLink: 'https://x.com',
    })

    expect(result).toEqual({ ok: false, error: 'Domain not verified' })
  })

  it('handles unexpected exceptions from Resend client', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network down'))
    const { sendInviteEmail } = await import('@/lib/email/transactional')

    const result = await sendInviteEmail({
      to: 'x@test.com',
      inviteeName: 'X',
      inviterName: 'Y',
      campaignName: 'Z',
      role: 'volunteer',
      actionLink: 'https://x.com',
    })

    expect(result).toEqual({ ok: false, error: 'Network down' })
  })

  it('renders role-specific subjects', async () => {
    const { sendInviteEmail } = await import('@/lib/email/transactional')

    await sendInviteEmail({
      to: 'a@test.com',
      inviteeName: 'A',
      inviterName: 'B',
      campaignName: 'Campaña X',
      role: 'analyst',
      actionLink: 'https://x.com',
    })
    expect(mockSend.mock.calls[0][0].subject).toBe('Te invitaron como analista a Campaña X')

    await sendInviteEmail({
      to: 'a@test.com',
      inviteeName: 'A',
      inviterName: 'B',
      campaignName: 'Campaña X',
      role: 'field_coordinator',
      actionLink: 'https://x.com',
    })
    expect(mockSend.mock.calls[1][0].subject).toBe('Te invitaron a coordinar campo en Campaña X')
  })
})

describe('sendPasswordResetEmail', () => {
  it('sends from the noreply@ sender with the reset template', async () => {
    const { sendPasswordResetEmail } = await import('@/lib/email/transactional')

    const result = await sendPasswordResetEmail({
      to: 'u@test.com',
      userName: 'Usuario Prueba',
      actionLink: 'https://app.scrutix.co/reset?token=xyz',
    })

    expect(result.ok).toBe(true)
    const call = mockSend.mock.calls[0][0]
    expect(call.from).toBe('Scrutix <noreply@scrutix.co>')
    expect(call.subject).toBe('Restablece tu contraseña — Scrutix')
    expect(call.html).toContain('Usuario Prueba')
    expect(call.html).toContain('https://app.scrutix.co/reset?token=xyz')
  })
})

describe('sendVerificationEmail', () => {
  it('sends the verification template via Resend', async () => {
    const { sendVerificationEmail } = await import('@/lib/email/transactional')

    const result = await sendVerificationEmail({
      to: 'u@test.com',
      actionLink: 'https://app.scrutix.co/confirm?token=abc',
    })

    expect(result.ok).toBe(true)
    const call = mockSend.mock.calls[0][0]
    expect(call.from).toBe('Scrutix <noreply@scrutix.co>')
    expect(call.subject).toBe('Confirma tu email — Scrutix')
    expect(call.html).toContain('https://app.scrutix.co/confirm?token=abc')
  })
})

describe('getAppUrl', () => {
  it('returns NEXT_PUBLIC_APP_URL when set', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://staging.scrutix.co'
    vi.resetModules()
    const { getAppUrl } = await import('@/lib/email/transactional')
    expect(getAppUrl()).toBe('https://staging.scrutix.co')
  })

  it('falls back to production URL when env is missing', async () => {
    delete process.env.NEXT_PUBLIC_APP_URL
    vi.resetModules()
    const { getAppUrl } = await import('@/lib/email/transactional')
    expect(getAppUrl()).toBe('https://app.scrutix.co')
  })
})
