import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { POST } from '@/app/api/auth/verify-impersonation/route'
import { jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const mockJwtVerify = vi.mocked(jwtVerify)
const mockCreateClient = vi.mocked(createClient)
const mockCreateAdminClient = vi.mocked(createAdminClient)

function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/auth/verify-impersonation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/verify-impersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.IMPERSONATION_SECRET = 'test-secret-at-least-32-chars-long!'
  })

  it('returns 400 when token is missing', async () => {
    const res = await POST(makeRequest({}))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Token requerido')
  })

  it('returns 401 when token is invalid JWT', async () => {
    mockJwtVerify.mockRejectedValue(new Error('invalid token'))

    const res = await POST(makeRequest({ token: 'bad-token' }))
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('Token inválido o expirado')
  })

  it('returns 400 when token does not have is_impersonation flag', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: 'user-123', is_impersonation: false },
      protectedHeader: { alg: 'HS256' },
    } as any)

    const res = await POST(makeRequest({ token: 'valid-token' }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Token no es de impersonación')
  })

  it('returns 404 when profile not found', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: 'user-123', is_impersonation: true },
      protectedHeader: { alg: 'HS256' },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null }),
      }),
    })

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      auth: { admin: {} },
    } as any)

    const res = await POST(makeRequest({ token: 'valid-token' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Usuario no encontrado')
  })

  it('returns 404 when auth user email not found', async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: 'user-123', is_impersonation: true },
      protectedHeader: { alg: 'HS256' },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-123', full_name: 'Test User', tenant_id: 'tenant-1' },
        }),
      }),
    })

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('not found'),
          }),
        },
      },
    } as any)

    const res = await POST(makeRequest({ token: 'valid-token' }))
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('No se pudo obtener email del usuario')
  })

  it('returns success with impersonation data on valid flow', async () => {
    const payload = {
      sub: 'user-123',
      is_impersonation: true,
      admin_id: 'admin-1',
      impersonated_by: 'admin@test.com',
      tenant_id: 'tenant-1',
      tenant_name: 'Test Tenant',
      impersonation_session_id: 'session-1',
    }

    mockJwtVerify.mockResolvedValue({
      payload,
      protectedHeader: { alg: 'HS256' },
    } as any)

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-123', full_name: 'Test User', tenant_id: 'tenant-1' },
        }),
      }),
    })

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({ select: mockSelect }),
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: 'user@test.com' } },
            error: null,
          }),
          generateLink: vi.fn().mockResolvedValue({
            data: { properties: { hashed_token: 'hashed-123' } },
            error: null,
          }),
        },
      },
    } as any)

    mockCreateClient.mockResolvedValue({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({ error: null }),
      },
    } as any)

    const res = await POST(makeRequest({ token: 'valid-token' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.admin_email).toBe('admin@test.com')
    expect(json.tenant_id).toBe('tenant-1')
    expect(json.tenant_name).toBe('Test Tenant')
    expect(json.session_id).toBe('session-1')
    expect(json.admin_id).toBe('admin-1')
    expect(json.started_at).toBeDefined()
    expect(json.expires_at).toBeDefined()
  })
})
