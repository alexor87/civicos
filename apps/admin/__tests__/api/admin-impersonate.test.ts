import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock jose — jsdom's TextEncoder output is not accepted by jose v6
const mockSign = vi.fn().mockResolvedValue('fake-header.fake-payload.fake-signature')
vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuer: vi.fn().mockReturnThis(),
    setAudience: vi.fn().mockReturnThis(),
    sign: mockSign,
  })),
}))

// Mock admin auth
const mockGetAdminFromRequest = vi.fn()
vi.mock('@/lib/admin-auth', () => ({
  getAdminFromRequest: (...args: unknown[]) => mockGetAdminFromRequest(...args),
}))

// Mock supabase admin client with builder pattern
const mockSingle = vi.fn()
const mockLimit = vi.fn(() => ({ single: mockSingle }))
const mockEq2 = vi.fn(() => ({ limit: mockLimit }))
const mockEq = vi.fn(() => ({ eq: mockEq2 }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

// Mock audit
const mockInsertAuditLog = vi.fn().mockResolvedValue(undefined)
vi.mock('@/lib/audit', () => ({
  insertAuditLog: (...args: unknown[]) => mockInsertAuditLog(...args),
}))

import { POST } from '@/app/api/admin/impersonate/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/impersonate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const fakeAdmin = { id: 'admin-1', email: 'admin@test.com' }
const fakeTenant = { id: 'tenant-1', name: 'Org Test', status: 'active' }
const fakeSuperAdmin = { id: 'user-1', full_name: 'Super Admin', tenant_id: 'tenant-1' }

describe('POST /api/admin/impersonate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.IMPERSONATION_SECRET = 'test-secret-at-least-32-chars-long!!'
  })

  it('returns 401 when getAdminFromRequest returns null', async () => {
    mockGetAdminFromRequest.mockResolvedValue(null)

    const res = await POST(makeRequest({ tenant_id: 'tenant-1' }))
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe('No autorizado')
  })

  it('returns 400 when tenant_id is missing', async () => {
    mockGetAdminFromRequest.mockResolvedValue(fakeAdmin)

    const res = await POST(makeRequest({}))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('tenant_id es requerido')
  })

  it('returns 400 when tenant_id is not a string', async () => {
    mockGetAdminFromRequest.mockResolvedValue(fakeAdmin)

    const res = await POST(makeRequest({ tenant_id: 123 }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('tenant_id es requerido')
  })

  it('returns 404 when tenant not found', async () => {
    mockGetAdminFromRequest.mockResolvedValue(fakeAdmin)

    // First call: tenants query — returns error
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    })

    const res = await POST(makeRequest({ tenant_id: 'nonexistent' }))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Tenant no encontrado')
  })

  it('returns 400 when tenant is cancelled', async () => {
    mockGetAdminFromRequest.mockResolvedValue(fakeAdmin)

    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({
        data: { ...fakeTenant, status: 'cancelled' },
        error: null,
      }),
    })

    const res = await POST(makeRequest({ tenant_id: 'tenant-1' }))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('No se puede impersonar un tenant cancelado')
  })

  it('returns 404 when no super_admin profile found', async () => {
    mockGetAdminFromRequest.mockResolvedValue(fakeAdmin)

    // First call: tenants query — success
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({ data: fakeTenant, error: null }),
    })

    // Second call: profiles query — no super_admin
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    const res = await POST(makeRequest({ tenant_id: 'tenant-1' }))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('No se encontró un super_admin para este tenant')
  })

  it('returns token and calls audit log on success', async () => {
    mockGetAdminFromRequest.mockResolvedValue(fakeAdmin)

    // First call: tenants query — success
    mockEq.mockReturnValueOnce({
      single: vi.fn().mockResolvedValue({ data: fakeTenant, error: null }),
    })

    // Second call: profiles query — success
    mockSingle.mockResolvedValueOnce({ data: fakeSuperAdmin, error: null })

    const res = await POST(makeRequest({ tenant_id: 'tenant-1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.token).toBeDefined()
    expect(typeof data.token).toBe('string')
    // JWT has 3 dot-separated parts
    expect(data.token.split('.').length).toBe(3)

    // Verify audit log was called
    expect(mockInsertAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        admin_id: fakeAdmin.id,
        admin_email: fakeAdmin.email,
        action: 'impersonate_start',
        tenant_id: fakeTenant.id,
        tenant_name: fakeTenant.name,
        payload: expect.objectContaining({
          super_admin_id: fakeSuperAdmin.id,
          super_admin_name: fakeSuperAdmin.full_name,
          impersonation_session_id: expect.any(String),
          session_expires_at: expect.any(String),
        }),
      }),
    )
  })
})
