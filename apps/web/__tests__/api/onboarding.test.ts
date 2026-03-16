import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Supabase admin mock ────────────────────────────────────────────────────────
const mockSingle = vi.fn()
const mockSelect = vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) }))
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: mockSingle })) }))
const mockDelete = vi.fn(() => ({ eq: vi.fn() }))
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }))
const mockUpsert = vi.fn()
const mockCreateUser = vi.fn()

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  delete: mockDelete,
  update: mockUpdate,
  upsert: mockUpsert,
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(async () => ({
    from: mockFrom,
    auth: { admin: { createUser: mockCreateUser } },
  })),
}))

// ── import route under test ────────────────────────────────────────────────────
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
  slug: 'campana-test',
  fullName: 'Admin User',
  email: 'admin@test.com',
  password: 'Secret123!',
  campaignName: 'Primera Campaña',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/onboarding', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ orgName: 'x' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('returns 409 when slug is already taken', async () => {
    // Slug check returns an existing tenant
    mockSingle.mockResolvedValueOnce({ data: { id: 'existing-id' }, error: null })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/subdominio/i)
  })

  it('returns 500 when tenant creation fails', async () => {
    // Slug check → not taken
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    // Tenant insert → error
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/organización/i)
  })

  it('returns 500 and rolls back tenant when auth user creation fails', async () => {
    // Slug check → not taken
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    // Tenant insert → success
    mockSingle.mockResolvedValueOnce({ data: { id: 'tenant-123' }, error: null })
    // Auth user creation → fails
    mockCreateUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error' } })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
    // Rollback: delete tenant
    expect(mockFrom).toHaveBeenCalledWith('tenants')
    expect(mockDelete).toHaveBeenCalled()
  })

  it('returns 200 with tenantId and campaignId on success', async () => {
    // Slug check → not taken
    mockSingle.mockResolvedValueOnce({ data: null, error: null })
    // Tenant insert → success
    mockSingle.mockResolvedValueOnce({ data: { id: 'tenant-abc' }, error: null })
    // Auth user creation → success
    mockCreateUser.mockResolvedValueOnce({ data: { user: { id: 'user-xyz' } }, error: null })
    // Campaign insert → success
    mockSingle.mockResolvedValueOnce({ data: { id: 'campaign-999' }, error: null })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.tenantId).toBe('tenant-abc')
    expect(body.campaignId).toBe('campaign-999')
  })
})
