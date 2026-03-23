import { describe, it, expect, vi, beforeEach } from 'vitest'

// Regression tests for flows API routes
// Bug: routes were selecting 'campaign_id' (singular) from profiles but the
// column is 'campaign_ids' (UUID array). This caused profile.campaign_id to be
// undefined, triggering the "No campaign" 400 guard on every request.

vi.mock('@/lib/supabase/server', () => ({
  createClient:      vi.fn(),
  createAdminClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }),
}))

const FLOW_PAYLOAD = {
  name:           'Test Flow',
  trigger_config: { type: 'contact_created', config: {} },
  actions_config: [{ type: 'send_whatsapp', config: { message: 'Hola {first_name}' } }],
  status:         'draft',
  ai_generated:   false,
}

const MOCK_FLOW = {
  id:             'flow-uuid-1',
  tenant_id:      'tenant-uuid-1',
  campaign_id:    'campaign-uuid-1',
  name:           'Test Flow',
  status:         'draft',
  trigger_config: FLOW_PAYLOAD.trigger_config,
  actions_config: FLOW_PAYLOAD.actions_config,
  filter_config:  [],
  created_at:     new Date().toISOString(),
  updated_at:     new Date().toISOString(),
}

function makeChain(resolved: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'neq', 'in', 'order', 'limit', 'not', 'single']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  // Make the chain itself thenable (await-able) and also allow terminal calls
  chain['single'] = vi.fn().mockResolvedValue(resolved)
  chain['then']   = (resolve: (v: unknown) => unknown) => Promise.resolve(resolved).then(resolve)
  return chain
}

function makeSupabaseMock({
  profileData = { campaign_ids: ['campaign-uuid-1'], tenant_id: 'tenant-uuid-1' } as Record<string, unknown> | null,
  insertResult = { data: MOCK_FLOW, error: null },
} = {}) {
  const insertMock = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(insertResult),
    }),
  })

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === 'profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: profileData, error: null }),
          }),
        }),
      }
    }
    if (table === 'automation_flows') {
      return {
        insert: insertMock,
        select: vi.fn().mockReturnValue(makeChain({ data: [], error: null })),
      }
    }
    // flow_executions and others — return empty arrays
    return { select: vi.fn().mockReturnValue(makeChain({ data: [], error: null })) }
  })

  const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-uuid-1' } } }) }
  return { from, auth, insertMock }
}

describe('POST /api/flows — campaign_ids fix', () => {
  beforeEach(() => { vi.resetModules() })

  it('usa campaign_ids[0] del perfil, no campaign_id singular', async () => {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { from, auth, insertMock } = makeSupabaseMock()
    vi.mocked(createClient).mockResolvedValue({ from, auth } as never)
    vi.mocked(createAdminClient).mockResolvedValue({ from } as never)

    const { POST } = await import('@/app/api/flows/route')
    const req = new Request('http://localhost/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FLOW_PAYLOAD),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(201)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ campaign_id: 'campaign-uuid-1' })
    )
  })

  it('retorna 400 cuando campaign_ids está vacío', async () => {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { from, auth } = makeSupabaseMock({ profileData: { campaign_ids: [], tenant_id: 'tenant-uuid-1' } })
    vi.mocked(createClient).mockResolvedValue({ from, auth } as never)
    vi.mocked(createAdminClient).mockResolvedValue({ from } as never)

    const { POST } = await import('@/app/api/flows/route')
    const req = new Request('http://localhost/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FLOW_PAYLOAD),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No campaign')
  })

  it('retorna 400 cuando el perfil no tiene campaign_ids', async () => {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { from, auth } = makeSupabaseMock({ profileData: { tenant_id: 'tenant-uuid-1' } })
    vi.mocked(createClient).mockResolvedValue({ from, auth } as never)
    vi.mocked(createAdminClient).mockResolvedValue({ from } as never)

    const { POST } = await import('@/app/api/flows/route')
    const req = new Request('http://localhost/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FLOW_PAYLOAD),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('retorna 400 cuando faltan campos requeridos', async () => {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { from, auth } = makeSupabaseMock()
    vi.mocked(createClient).mockResolvedValue({ from, auth } as never)
    vi.mocked(createAdminClient).mockResolvedValue({ from } as never)

    const { POST } = await import('@/app/api/flows/route')
    const req = new Request('http://localhost/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test sin trigger' }),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('requeridos')
  })

  it('retorna 401 cuando no hay usuario autenticado', async () => {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const from = vi.fn()
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
    vi.mocked(createClient).mockResolvedValue({ from, auth } as never)
    vi.mocked(createAdminClient).mockResolvedValue({ from } as never)

    const { POST } = await import('@/app/api/flows/route')
    const req = new Request('http://localhost/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(FLOW_PAYLOAD),
    })

    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/flows — campaign_ids fix', () => {
  beforeEach(() => { vi.resetModules() })

  it('retorna 200 y usa campaign_ids[0] para filtrar flows', async () => {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { from, auth } = makeSupabaseMock()
    vi.mocked(createClient).mockResolvedValue({ from, auth } as never)
    vi.mocked(createAdminClient).mockResolvedValue({ from } as never)

    const { GET } = await import('@/app/api/flows/route')
    const req = new Request('http://localhost/api/flows')
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('retorna 400 cuando no hay campaign_ids en el perfil', async () => {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { from, auth } = makeSupabaseMock({ profileData: { campaign_ids: [], tenant_id: 'tenant-uuid-1' } })
    vi.mocked(createClient).mockResolvedValue({ from, auth } as never)
    vi.mocked(createAdminClient).mockResolvedValue({ from } as never)

    const { GET } = await import('@/app/api/flows/route')
    const req = new Request('http://localhost/api/flows')
    const res = await GET(req as never)
    expect(res.status).toBe(400)
  })

  it('usa createAdminClient (no anon) para la query de automation_flows — regresión RLS', async () => {
    const { createClient, createAdminClient } = await import('@/lib/supabase/server')
    const { from: anonFrom, auth } = makeSupabaseMock()
    const adminFromSpy = vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { campaign_ids: ['campaign-uuid-1'], tenant_id: 'tenant-uuid-1' }, error: null }),
            }),
          }),
        }
      }
      return { select: vi.fn().mockReturnValue(makeChain({ data: [], error: null })) }
    })

    vi.mocked(createClient).mockResolvedValue({ from: anonFrom, auth } as never)
    vi.mocked(createAdminClient).mockResolvedValue({ from: adminFromSpy } as never)

    const { GET } = await import('@/app/api/flows/route')
    const req = new Request('http://localhost/api/flows')
    const res = await GET(req as never)
    expect(res.status).toBe(200)
    // adminFromSpy debe haberse llamado con automation_flows (no el anon from)
    expect(adminFromSpy).toHaveBeenCalledWith('automation_flows')
    // El anon from NO debe haberse llamado con automation_flows
    const anonFlowsCall = (anonFrom as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: unknown[]) => c[0] === 'automation_flows'
    )
    expect(anonFlowsCall).toBeUndefined()
  })
})
