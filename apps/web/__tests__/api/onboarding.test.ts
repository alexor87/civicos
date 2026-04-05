import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Supabase admin mock ────────────────────────────────────────────────────────
const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }))
const mockDelete = vi.fn(() => ({ eq: vi.fn() }))
const mockUpsert = vi.fn()
const mockCreateUser = vi.fn()
const mockGenerateLink = vi.fn()

const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  delete: mockDelete,
  upsert: mockUpsert,
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(async () => ({
    from: mockFrom,
    auth: { admin: { createUser: mockCreateUser, generateLink: mockGenerateLink } },
  })),
}))

const mockSendVerificationEmail = vi.fn()
vi.mock('@/lib/email/send-verification-email', () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
}))

// Mock global fetch for fire-and-forget seed call
const originalFetch = globalThis.fetch
beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue(new Response('{}'))
})

import { POST } from '@/app/api/onboarding/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  orgName: 'Campaña Test',
  email: 'admin@test.com',
  password: 'Secret123!',
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  // Default: generateLink success + send success
  mockGenerateLink.mockResolvedValue({
    data: { properties: { action_link: 'https://test.supabase.co/auth/v1/verify?token=abc', hashed_token: 'hashed-abc' } },
    error: null,
  })
  mockSendVerificationEmail.mockResolvedValue({ ok: true })
})

describe('POST /api/onboarding', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ orgName: 'x' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({ orgName: 'Test', password: '12345678' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when tenant creation fails', async () => {
    // Tenant insert → error
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/organización/i)
  })

  it('returns 500 and rolls back tenant when auth user creation fails', async () => {
    // Tenant insert → success
    mockSingle.mockResolvedValueOnce({ data: { id: 'tenant-123' }, error: null })
    // Auth user creation → fails
    mockCreateUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error' } })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
    // Rollback: should delete tenant_branding and tenant
    expect(mockFrom).toHaveBeenCalledWith('tenant_branding')
    expect(mockFrom).toHaveBeenCalledWith('tenants')
    expect(mockDelete).toHaveBeenCalled()
  })

  it('returns 200 with tenantId on success and fires seed', async () => {
    // Tenant insert → success
    mockSingle.mockResolvedValueOnce({ data: { id: 'tenant-abc' }, error: null })
    // Auth user creation → success
    mockCreateUser.mockResolvedValueOnce({ data: { user: { id: 'user-xyz' } }, error: null })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.tenantId).toBe('tenant-abc')

    // Should create onboarding_state
    expect(mockFrom).toHaveBeenCalledWith('onboarding_state')

    // Should fire seed Edge Function
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('seed-demo-campaign'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('generates slug from orgName automatically', async () => {
    // Tenant insert → success
    mockSingle.mockResolvedValueOnce({ data: { id: 'tenant-abc' }, error: null })
    mockCreateUser.mockResolvedValueOnce({ data: { user: { id: 'user-xyz' } }, error: null })

    await POST(makeRequest({ orgName: 'Mi Campaña Élite', email: 'a@b.co', password: '12345678' }))

    // Verify tenant was created with auto-generated slug
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mi Campaña Élite',
        slug: expect.stringMatching(/^mi-campana-elite-[a-z0-9]{4}$/),
      })
    )
  })

  it('creates auth user with email_confirm: false and sends verification email', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'tenant-abc' }, error: null })
    mockCreateUser.mockResolvedValueOnce({ data: { user: { id: 'user-xyz' } }, error: null })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)

    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email_confirm: false })
    )
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'magiclink', email: VALID_BODY.email })
    )
    expect(mockSendVerificationEmail).toHaveBeenCalledWith({
      email: VALID_BODY.email,
      actionLink: expect.stringContaining('/auth/callback?token_hash=hashed-abc&type=magiclink&next=/welcome'),
    })
  })

  it('still returns 200 when verification email fails to send', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'tenant-abc' }, error: null })
    mockCreateUser.mockResolvedValueOnce({ data: { user: { id: 'user-xyz' } }, error: null })
    mockSendVerificationEmail.mockResolvedValueOnce({ ok: false, error: 'resend down' })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('does not create a campaign directly', async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: 'tenant-abc' }, error: null })
    mockCreateUser.mockResolvedValueOnce({ data: { user: { id: 'user-xyz' } }, error: null })

    await POST(makeRequest(VALID_BODY))

    // campaigns table should NOT be called — seed Edge Function handles it
    const campaignCalls = mockFrom.mock.calls.filter(([table]: [string]) => table === 'campaigns')
    expect(campaignCalls).toHaveLength(0)
  })
})
