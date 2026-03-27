import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockCheckPermissions = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({})),
}))

vi.mock('@/lib/auth/check-permission', () => ({
  checkPermissions: (...args: any[]) => mockCheckPermissions(...args),
}))

vi.mock('@/lib/permissions', () => ({
  ALL_PERMISSIONS: ['contacts.view', 'contacts.create', 'roles.manage'],
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
})

describe('GET /api/me/permissions', () => {
  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { GET } = await import('@/app/api/me/permissions/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('devuelve permisos del usuario autenticado', async () => {
    const permMap = {
      'contacts.view': true,
      'contacts.create': false,
      'roles.manage': false,
    }
    mockCheckPermissions.mockResolvedValueOnce(permMap)

    const { GET } = await import('@/app/api/me/permissions/route')
    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toEqual(permMap)
  })

  it('llama a checkPermissions con ALL_PERMISSIONS', async () => {
    mockCheckPermissions.mockResolvedValueOnce({})

    const { GET } = await import('@/app/api/me/permissions/route')
    await GET()

    expect(mockCheckPermissions).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      ['contacts.view', 'contacts.create', 'roles.manage']
    )
  })
})
