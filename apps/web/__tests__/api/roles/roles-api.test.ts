import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ──────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()
const mockRpc     = vi.fn()

function makeChain(data: unknown, error: unknown = null) {
  const chain: Record<string, any> = {
    select:  () => chain,
    insert:  () => chain,
    update:  () => chain,
    delete:  () => chain,
    eq:      () => chain,
    neq:     () => chain,
    not:     () => chain,
    order:   () => chain,
    in:      () => chain,
    single:  async () => ({ data, error }),
    then:    (resolve: (v: { data: unknown; error: unknown }) => void) => resolve({ data, error }),
  }
  return chain
}

let fromHandler: (table: string) => any

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: (...args: any[]) => fromHandler(args[0]),
    rpc: mockRpc,
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (...args: any[]) => fromHandler(args[0]),
    rpc: mockRpc,
  })),
}))

// ── checkPermission mock (used by [roleId] routes, not by main route) ────────

const mockCheckPermission = vi.fn()

vi.mock('@/lib/auth/check-permission', () => ({
  checkPermission: (...args: any[]) => mockCheckPermission(...args),
}))

// ── permissions mock ────────────────────────────────────────────────────────────

vi.mock('@/lib/permissions', () => ({
  ALL_PERMISSIONS: ['contacts.view', 'contacts.create', 'roles.manage'],
}))

// ── initializeSystemRoles mock ──────────────────────────────────────────────────

const mockInitializeSystemRoles = vi.fn()

vi.mock('@/lib/roles/initialize-system-roles', () => ({
  initializeSystemRoles: (...args: any[]) => mockInitializeSystemRoles(...args),
}))

// ── Helpers ─────────────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init)
}

// ── Setup ───────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  mockCheckPermission.mockResolvedValue(true)
  // Default: RPC check_user_permission returns true, other RPCs succeed
  mockRpc.mockImplementation((name: string) => {
    if (name === 'check_user_permission') {
      return Promise.resolve({ data: true, error: null })
    }
    return Promise.resolve({ data: null, error: null })
  })
  mockInitializeSystemRoles.mockResolvedValue({ success: true })

  // Default fromHandler: profiles returns tenant_id, custom_roles returns roles array
  fromHandler = (table: string) => {
    if (table === 'profiles') {
      // Supports both .single() (tenant lookup) and .not() chain (member counts)
      const chain: Record<string, any> = {}
      chain.select = () => chain
      chain.eq = () => chain
      chain.neq = () => chain
      chain.not = () => ({
        then: (r: any) => r({ data: [], error: null }),
      })
      chain.order = () => chain
      chain.in = () => chain
      chain.single = async () => ({ data: { tenant_id: 'tenant-1', custom_role_id: null }, error: null })
      chain.then = (r: any) => r({ data: { tenant_id: 'tenant-1', custom_role_id: null }, error: null })
      return chain
    }
    if (table === 'custom_roles') {
      const rolesData = [{ id: 'role-1', name: 'Admin', is_system: true }]
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
            }),
            order: () => ({
              order: () => ({
                then: (r: any) => r({ data: rolesData, error: null }),
              }),
            }),
            single: async () => ({ data: { tenant_id: 'tenant-1' }, error: null }),
          }),
          single: async () => ({ data: null, error: null }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'new-role', name: 'Custom Role' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            then: (r: any) => r({ data: null, error: null }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            then: (r: any) => r({ data: null, error: null }),
          }),
        }),
      }
    }
    if (table === 'role_permissions') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              then: (r: any) => r({ data: [], error: null }),
            }),
            order: () => ({
              then: (r: any) => r({ data: [{ permission: 'contacts.view', is_active: true }], error: null }),
            }),
          }),
        }),
        insert: () => ({
          then: (r: any) => r({ data: null, error: null }),
        }),
        upsert: async () => ({ data: null, error: null }),
        delete: () => ({
          eq: () => ({
            then: (r: any) => r({ data: null, error: null }),
          }),
        }),
      }
    }
    return makeChain(null)
  }
})

// ── Tests: GET /api/roles ───────────────────────────────────────────────────────

describe('GET /api/roles', () => {
  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { GET } = await import('@/app/api/roles/route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso roles.manage', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'check_user_permission') {
        return Promise.resolve({ data: false, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const { GET } = await import('@/app/api/roles/route')
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('usa fallback directo cuando get_tenant_roles RPC falla', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'check_user_permission') {
        return Promise.resolve({ data: true, error: null })
      }
      if (name === 'get_tenant_roles') {
        return Promise.resolve({ data: null, error: { message: 'not in schema cache' } })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const { GET } = await import('@/app/api/roles/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('devuelve lista de roles desde get_tenant_roles RPC', async () => {
    const mockRoles = [
      { id: 'role-1', name: 'Super Admin', is_system: true, member_count: 2 },
      { id: 'role-2', name: 'Custom', is_system: false, member_count: 0 },
    ]
    mockRpc.mockImplementation((name: string) => {
      if (name === 'check_user_permission') {
        return Promise.resolve({ data: true, error: null })
      }
      if (name === 'get_tenant_roles') {
        return Promise.resolve({ data: mockRoles, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const { GET } = await import('@/app/api/roles/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(2)
    expect(body[0].member_count).toBe(2)
    expect(mockRpc).toHaveBeenCalledWith('get_tenant_roles', { p_tenant_id: 'tenant-1' })
  })

  it('usa fallback si RPC retorna null sin error', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'check_user_permission') {
        return Promise.resolve({ data: true, error: null })
      }
      if (name === 'get_tenant_roles') {
        return Promise.resolve({ data: null, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const { GET } = await import('@/app/api/roles/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

// ── Tests: POST /api/roles ──────────────────────────────────────────────────────

describe('POST /api/roles', () => {
  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { POST } = await import('@/app/api/roles/route')
    const req = makeRequest('http://localhost/api/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Role' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'check_user_permission') {
        return Promise.resolve({ data: false, error: null })
      }
      return Promise.resolve({ data: null, error: null })
    })
    const { POST } = await import('@/app/api/roles/route')
    const req = makeRequest('http://localhost/api/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Role' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('devuelve 400 para nombre corto (menos de 3 caracteres)', async () => {
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain({ tenant_id: 'tenant-1' })
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/roles/route')
    const req = makeRequest('http://localhost/api/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'ab' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('3 caracteres')
  })

  it('devuelve 400 para nombre largo (más de 40 caracteres)', async () => {
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain({ tenant_id: 'tenant-1' })
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/roles/route')
    const req = makeRequest('http://localhost/api/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'A'.repeat(41) }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('40 caracteres')
  })

  it('devuelve 409 si ya existe un rol con el mismo slug', async () => {
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain({ tenant_id: 'tenant-1' })
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: { id: 'existing-id' }, error: null }),
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/roles/route')
    const req = makeRequest('http://localhost/api/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Existing Role' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it('devuelve 400 si intenta usar un nombre de rol del sistema', async () => {
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain({ tenant_id: 'tenant-1' })
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/roles/route')
    const req = makeRequest('http://localhost/api/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Super Admin' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('rol del sistema')
  })

  it('crea un rol y devuelve 201', async () => {
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain({ tenant_id: 'tenant-1' })
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'new-role', name: 'Mi Rol Custom' }, error: null }),
            }),
          }),
        }
      }
      if (table === 'role_permissions') {
        return {
          select: () => ({
            eq: () => ({
              then: (r: any) => r({ data: [], error: null }),
            }),
          }),
          insert: () => ({
            then: (r: any) => r({ data: null, error: null }),
          }),
        }
      }
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/roles/route')
    const req = makeRequest('http://localhost/api/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Mi Rol Custom', description: 'Desc', color: '#FF0000' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('id')
  })
})

// ── Tests: PATCH /api/roles/[roleId] ────────────────────────────────────────────

describe('PATCH /api/roles/[roleId]', () => {
  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { PATCH } = await import('@/app/api/roles/[roleId]/route')
    const req = makeRequest('http://localhost/api/roles/role-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso', async () => {
    mockCheckPermission.mockResolvedValueOnce(false)
    const { PATCH } = await import('@/app/api/roles/[roleId]/route')
    const req = makeRequest('http://localhost/api/roles/role-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(403)
  })

  it('devuelve 404 si el rol no existe', async () => {
    fromHandler = (table: string) => {
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { PATCH } = await import('@/app/api/roles/[roleId]/route')
    const req = makeRequest('http://localhost/api/roles/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ roleId: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('actualiza un rol custom y devuelve success', async () => {
    fromHandler = (table: string) => {
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { is_system: false }, error: null }),
            }),
          }),
          update: () => ({
            eq: () => ({
              then: (r: any) => r({ data: null, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { PATCH } = await import('@/app/api/roles/[roleId]/route')
    const req = makeRequest('http://localhost/api/roles/role-2', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed', color: '#00FF00' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ roleId: 'role-2' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ── Tests: DELETE /api/roles/[roleId] ───────────────────────────────────────────

describe('DELETE /api/roles/[roleId]', () => {
  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { DELETE } = await import('@/app/api/roles/[roleId]/route')
    const req = makeRequest('http://localhost/api/roles/role-2', {
      method: 'DELETE',
      body: JSON.stringify({ reassign_to_role_id: 'role-1' }),
    })
    const res = await DELETE(req, { params: Promise.resolve({ roleId: 'role-2' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 400 al intentar eliminar un rol del sistema', async () => {
    fromHandler = (table: string) => {
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { is_system: true, tenant_id: 'tenant-1' }, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { DELETE } = await import('@/app/api/roles/[roleId]/route')
    const req = makeRequest('http://localhost/api/roles/role-1', {
      method: 'DELETE',
      body: JSON.stringify({ reassign_to_role_id: 'role-2' }),
    })
    const res = await DELETE(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('roles del sistema')
  })

  it('devuelve 400 sin reassign_to_role_id', async () => {
    fromHandler = (table: string) => {
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { is_system: false, tenant_id: 'tenant-1' }, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { DELETE } = await import('@/app/api/roles/[roleId]/route')
    const req = makeRequest('http://localhost/api/roles/role-2', {
      method: 'DELETE',
      body: JSON.stringify({}),
    })
    const res = await DELETE(req, { params: Promise.resolve({ roleId: 'role-2' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('reasignación')
  })

  it('elimina un rol custom y devuelve success', async () => {
    fromHandler = (table: string) => {
      if (table === 'custom_roles') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { is_system: false, tenant_id: 'tenant-1' }, error: null }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              then: (r: any) => r({ data: null, error: null }),
            }),
          }),
        }
      }
      if (table === 'profiles') {
        return {
          update: () => ({
            eq: () => ({
              eq: () => ({
                then: (r: any) => r({ data: null, error: null }),
              }),
            }),
          }),
        }
      }
      if (table === 'role_permissions') {
        return {
          delete: () => ({
            eq: () => ({
              then: (r: any) => r({ data: null, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { DELETE } = await import('@/app/api/roles/[roleId]/route')
    const req = makeRequest('http://localhost/api/roles/role-2', {
      method: 'DELETE',
      body: JSON.stringify({ reassign_to_role_id: 'role-1' }),
    })
    const res = await DELETE(req, { params: Promise.resolve({ roleId: 'role-2' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})

// ── Tests: GET /api/roles/[roleId]/permissions ──────────────────────────────────

describe('GET /api/roles/[roleId]/permissions', () => {
  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { GET } = await import('@/app/api/roles/[roleId]/permissions/route')
    const req = makeRequest('http://localhost/api/roles/role-1/permissions')
    const res = await GET(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso', async () => {
    mockCheckPermission.mockResolvedValueOnce(false)
    const { GET } = await import('@/app/api/roles/[roleId]/permissions/route')
    const req = makeRequest('http://localhost/api/roles/role-1/permissions')
    const res = await GET(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(403)
  })

  it('devuelve permisos del rol', async () => {
    fromHandler = (table: string) => {
      if (table === 'role_permissions') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                then: (r: any) => r({
                  data: [
                    { permission: 'contacts.view', is_active: true },
                    { permission: 'roles.manage', is_active: false },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { GET } = await import('@/app/api/roles/[roleId]/permissions/route')
    const req = makeRequest('http://localhost/api/roles/role-1/permissions')
    const res = await GET(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(2)
  })
})

// ── Tests: PUT /api/roles/[roleId]/permissions ──────────────────────────────────

describe('PUT /api/roles/[roleId]/permissions', () => {
  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { PUT } = await import('@/app/api/roles/[roleId]/permissions/route')
    const req = makeRequest('http://localhost/api/roles/role-1/permissions', {
      method: 'PUT',
      body: JSON.stringify({ permissions: [] }),
    })
    const res = await PUT(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 400 si permissions no es un array', async () => {
    const { PUT } = await import('@/app/api/roles/[roleId]/permissions/route')
    const req = makeRequest('http://localhost/api/roles/role-1/permissions', {
      method: 'PUT',
      body: JSON.stringify({ permissions: 'not-an-array' }),
    })
    const res = await PUT(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('array')
  })

  it('guarda permisos vía upsert directo y devuelve success', async () => {
    const { PUT } = await import('@/app/api/roles/[roleId]/permissions/route')
    const req = makeRequest('http://localhost/api/roles/role-1/permissions', {
      method: 'PUT',
      body: JSON.stringify({
        permissions: [
          { permission: 'contacts.view', is_active: true },
          { permission: 'contacts.create', is_active: false },
        ],
      }),
    })
    const res = await PUT(req, { params: Promise.resolve({ roleId: 'role-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
