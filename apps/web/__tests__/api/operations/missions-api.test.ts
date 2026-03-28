import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ──────────────────────────────────────────────────────────────

const mockGetUser = vi.fn()

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
    lte:     () => chain,
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
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (...args: any[]) => fromHandler(args[0]),
  })),
}))

// ── checkPermission mock ────────────────────────────────────────────────────

const mockCheckPermission = vi.fn()

vi.mock('@/lib/auth/check-permission', () => ({
  checkPermission: (...args: any[]) => mockCheckPermission(...args),
}))

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init)
}

// ── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  mockCheckPermission.mockResolvedValue(true)

  fromHandler = (table: string) => {
    if (table === 'profiles') {
      return makeChain({ tenant_id: 'tenant-1' })
    }
    if (table === 'missions') {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              eq: () => ({
                then: (r: any) => r({ data: [], error: null }),
              }),
              then: (r: any) => r({ data: [], error: null }),
            }),
            single: async () => ({ data: null, error: null }),
            then: (r: any) => r({ data: [], error: null }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'mission-1', name: 'Test Mission' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'mission-1', name: 'Updated' }, error: null }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            then: (r: any) => r({ data: null, error: null }),
          }),
        }),
      }
    }
    if (table === 'tasks') {
      return makeChain([])
    }
    if (table === 'mission_members') {
      return makeChain([])
    }
    if (table === 'mission_templates') {
      return makeChain(null)
    }
    return makeChain(null)
  }
})

// ── Tests: GET /api/operations/missions ─────────────────────────────────────

describe('GET /api/operations/missions', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { GET } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions?campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso operations.view', async () => {
    mockCheckPermission.mockResolvedValueOnce(false)
    const { GET } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions?campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('devuelve 400 si no se proporciona campaign_id', async () => {
    const { GET } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('campaign_id')
  })

  it('devuelve 200 con lista de misiones', async () => {
    const mockMissions = [
      { id: 'm-1', name: 'Mision 1', status: 'active' },
      { id: 'm-2', name: 'Mision 2', status: 'completed' },
    ]
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                then: (r: any) => r({ data: mockMissions, error: null }),
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { GET } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions?campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(2)
  })

  it('filtra misiones por status cuando se proporciona', async () => {
    const mockMissions = [{ id: 'm-1', name: 'Mision Activa', status: 'active' }]
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                eq: () => ({
                  then: (r: any) => r({ data: mockMissions, error: null }),
                }),
                then: (r: any) => r({ data: mockMissions, error: null }),
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { GET } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions?campaign_id=camp-1&status=active')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.length).toBe(1)
    expect(body[0].status).toBe('active')
  })
})

// ── Tests: POST /api/operations/missions ────────────────────────────────────

describe('POST /api/operations/missions', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { POST } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1', name: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso operations.create_missions', async () => {
    mockCheckPermission.mockResolvedValueOnce(false)
    const { POST } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1', name: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('devuelve 400 si falta name', async () => {
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain({ tenant_id: 'tenant-1' })
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('name')
  })

  it('devuelve 400 si falta campaign_id', async () => {
    const { POST } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Mission' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('campaign_id')
  })

  it('crea mision y devuelve 201', async () => {
    const createdMission = { id: 'mission-new', name: 'Nueva Mision', campaign_id: 'camp-1' }
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain({ tenant_id: 'tenant-1' })
      if (table === 'mission_templates') return makeChain(null)
      if (table === 'missions') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: createdMission, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1', name: 'Nueva Mision' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('id')
    expect(body.name).toBe('Nueva Mision')
  })

  it('devuelve 404 si el perfil del usuario no existe', async () => {
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain(null)
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/operations/missions/route')
    const req = makeRequest('http://localhost/api/operations/missions', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1', name: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})

// ── Tests: GET /api/operations/missions/[id] ────────────────────────────────

describe('GET /api/operations/missions/[id]', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { GET } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso', async () => {
    mockCheckPermission.mockResolvedValueOnce(false)
    const { GET } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(403)
  })

  it('devuelve 404 si la mision no existe', async () => {
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { message: 'not found' } }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { GET } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/nonexistent')
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('devuelve mision con tasks y members', async () => {
    const mockMission = { id: 'm-1', name: 'Test Mission', status: 'active' }
    const mockTasks = [{ id: 't-1', title: 'Task 1' }]
    const mockMembers = [{ profile_id: 'p-1', added_at: '2026-01-01' }]
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockMission, error: null }),
            }),
          }),
        }
      }
      if (table === 'tasks') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                order: () => ({
                  then: (r: any) => r({ data: mockTasks, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'mission_members') {
        return {
          select: () => ({
            eq: () => ({
              then: (r: any) => r({ data: mockMembers, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { GET } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('m-1')
    expect(body.tasks).toHaveLength(1)
    expect(body.members).toHaveLength(1)
  })
})

// ── Tests: PATCH /api/operations/missions/[id] ──────────────────────────────

describe('PATCH /api/operations/missions/[id]', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { PATCH } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 404 si la mision no existe', async () => {
    fromHandler = (table: string) => {
      if (table === 'missions') {
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
    const { PATCH } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('devuelve 403 si no es creador/owner y no tiene manage_all', async () => {
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { created_by: 'other-user', owner_id: 'other-user' },
                error: null,
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    // First call succeeds (auth), second call fails (manage_all permission)
    mockCheckPermission.mockResolvedValueOnce(false)
    const { PATCH } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(403)
  })

  it('actualiza mision como creador y devuelve 200', async () => {
    const updatedMission = { id: 'm-1', name: 'Updated Mission' }
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { created_by: 'user-1', owner_id: 'user-1' },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: updatedMission, error: null }),
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { PATCH } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Mission' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Updated Mission')
  })

  it('devuelve 400 si no hay campos para actualizar', async () => {
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { created_by: 'user-1', owner_id: 'user-1' },
                error: null,
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { PATCH } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(400)
  })
})

// ── Tests: DELETE /api/operations/missions/[id] ─────────────────────────────

describe('DELETE /api/operations/missions/[id]', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { DELETE } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 404 si la mision no existe', async () => {
    fromHandler = (table: string) => {
      if (table === 'missions') {
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
    const { DELETE } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/nonexistent', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('devuelve 403 si no es creador y no tiene manage_all', async () => {
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { created_by: 'other-user' },
                error: null,
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    mockCheckPermission.mockResolvedValueOnce(false)
    const { DELETE } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(403)
  })

  it('elimina mision como creador y devuelve success', async () => {
    fromHandler = (table: string) => {
      if (table === 'missions') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { created_by: 'user-1' },
                error: null,
              }),
            }),
          }),
          delete: () => ({
            eq: () => ({
              then: (r: any) => r({ data: null, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { DELETE } = await import('@/app/api/operations/missions/[id]/route')
    const req = makeRequest('http://localhost/api/operations/missions/m-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'm-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
