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
    if (table === 'tasks') {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                order: () => ({
                  then: (r: any) => r({ data: [], error: null }),
                }),
              }),
              lte: () => ({
                order: () => ({
                  order: () => ({
                    then: (r: any) => r({ data: [], error: null }),
                  }),
                }),
              }),
              single: async () => ({ data: null, error: null }),
            }),
            order: () => ({
              order: () => ({
                then: (r: any) => r({ data: [], error: null }),
              }),
            }),
            lte: () => ({
              order: () => ({
                order: () => ({
                  then: (r: any) => r({ data: [], error: null }),
                }),
              }),
            }),
            single: async () => ({ data: null, error: null }),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'task-1', title: 'Test Task' }, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            select: () => ({
              single: async () => ({ data: { id: 'task-1', title: 'Updated' }, error: null }),
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
})

// ── Tests: GET /api/operations/tasks ────────────────────────────────────────

describe('GET /api/operations/tasks', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { GET } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks?campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso operations.view', async () => {
    mockCheckPermission.mockResolvedValueOnce(false)
    const { GET } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks?campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('devuelve 400 si no se proporciona campaign_id', async () => {
    const { GET } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('campaign_id')
  })

  it('devuelve 200 con lista de tareas filtradas por campaign_id', async () => {
    const mockTasks = [
      { id: 't-1', title: 'Tarea 1', status: 'pending' },
      { id: 't-2', title: 'Tarea 2', status: 'completed' },
    ]
    fromHandler = (table: string) => {
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
      return makeChain(null)
    }
    const { GET } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks?campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(2)
  })

  it('aplica filtros opcionales (mission_id, status, assignee_id)', async () => {
    const mockTasks = [{ id: 't-1', title: 'Filtered Task', status: 'pending' }]
    fromHandler = (table: string) => {
      if (table === 'tasks') return makeChain(mockTasks)
      return makeChain(null)
    }
    const { GET } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks?campaign_id=camp-1&mission_id=m-1&status=pending')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.length).toBe(1)
  })
})

// ── Tests: POST /api/operations/tasks ───────────────────────────────────────

describe('POST /api/operations/tasks', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { POST } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1', title: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso operations.create_tasks', async () => {
    mockCheckPermission.mockResolvedValueOnce(false)
    const { POST } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1', title: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('devuelve 400 si falta title', async () => {
    const { POST } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('title')
  })

  it('devuelve 400 si falta campaign_id', async () => {
    const { POST } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Task' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('campaign_id')
  })

  it('crea tarea y devuelve 201', async () => {
    const createdTask = { id: 'task-new', title: 'Nueva Tarea', campaign_id: 'camp-1' }
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain({ tenant_id: 'tenant-1' })
      if (table === 'tasks') {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: createdTask, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1', title: 'Nueva Tarea' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('id')
    expect(body.title).toBe('Nueva Tarea')
  })

  it('devuelve 404 si el perfil del usuario no existe', async () => {
    fromHandler = (table: string) => {
      if (table === 'profiles') return makeChain(null)
      return makeChain(null)
    }
    const { POST } = await import('@/app/api/operations/tasks/route')
    const req = makeRequest('http://localhost/api/operations/tasks', {
      method: 'POST',
      body: JSON.stringify({ campaign_id: 'camp-1', title: 'Test' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })
})

// ── Tests: GET /api/operations/tasks/[id] ───────────────────────────────────

describe('GET /api/operations/tasks/[id]', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { GET } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1')
    const res = await GET(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 403 sin permiso', async () => {
    mockCheckPermission.mockResolvedValueOnce(false)
    const { GET } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1')
    const res = await GET(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(403)
  })

  it('devuelve tarea con assignee y mission', async () => {
    const mockTask = {
      id: 't-1',
      title: 'Test Task',
      assignee: { id: 'u-1', full_name: 'User 1' },
      mission: { id: 'm-1', name: 'Mission 1' },
    }
    fromHandler = (table: string) => {
      if (table === 'tasks') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: mockTask, error: null }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { GET } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1')
    const res = await GET(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('t-1')
    expect(body.assignee).toBeDefined()
    expect(body.mission).toBeDefined()
  })
})

// ── Tests: PATCH /api/operations/tasks/[id] ─────────────────────────────────

describe('PATCH /api/operations/tasks/[id]', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { PATCH } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 404 si la tarea no existe', async () => {
    fromHandler = (table: string) => {
      if (table === 'tasks') {
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
    const { PATCH } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/nonexistent', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('devuelve 403 si no es assignee/creator y no tiene manage_all', async () => {
    fromHandler = (table: string) => {
      if (table === 'tasks') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { assignee_id: 'other-user', created_by: 'other-user', status: 'pending' },
                error: null,
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    mockCheckPermission.mockResolvedValueOnce(false)
    const { PATCH } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(403)
  })

  it('actualiza status de tarea como assignee y devuelve 200', async () => {
    const updatedTask = { id: 't-1', title: 'Task', status: 'completed' }
    fromHandler = (table: string) => {
      if (table === 'tasks') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { assignee_id: 'user-1', created_by: 'other-user', status: 'pending' },
                error: null,
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({ data: updatedTask, error: null }),
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { PATCH } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('completed')
  })

  it('devuelve 400 si no hay campos para actualizar', async () => {
    fromHandler = (table: string) => {
      if (table === 'tasks') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { assignee_id: 'user-1', created_by: 'user-1', status: 'pending' },
                error: null,
              }),
            }),
          }),
        }
      }
      return makeChain(null)
    }
    const { PATCH } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(400)
  })
})

// ── Tests: DELETE /api/operations/tasks/[id] ────────────────────────────────

describe('DELETE /api/operations/tasks/[id]', () => {
  it('devuelve 401 sin autenticacion', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const { DELETE } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(401)
  })

  it('devuelve 404 si la tarea no existe', async () => {
    fromHandler = (table: string) => {
      if (table === 'tasks') {
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
    const { DELETE } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/nonexistent', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('devuelve 403 si no es creador y no tiene manage_all', async () => {
    fromHandler = (table: string) => {
      if (table === 'tasks') {
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
    const { DELETE } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(403)
  })

  it('elimina tarea como creador y devuelve success', async () => {
    fromHandler = (table: string) => {
      if (table === 'tasks') {
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
    const { DELETE } = await import('@/app/api/operations/tasks/[id]/route')
    const req = makeRequest('http://localhost/api/operations/tasks/t-1', { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: 't-1' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
