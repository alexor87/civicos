import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET, DELETE } from '@/app/api/import/geo-units/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}))

import { createClient, createAdminClient } from '@/lib/supabase/server'

// ── Mock setup ─────────────────────────────────────────────────────────────────

const mockUserSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}

const mockAdminSupabase = {
  from: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockUserSupabase)
  ;(createAdminClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockAdminSupabase)
})

function setupAuth(role: string) {
  mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  const profileChain: Record<string, unknown> = {}
  profileChain.select = vi.fn().mockReturnValue(profileChain)
  profileChain.eq = vi.fn().mockReturnValue(profileChain)
  profileChain.single = vi.fn().mockResolvedValue({
    data: { tenant_id: 't1', campaign_ids: ['c1'], role },
  })
  mockUserSupabase.from = vi.fn().mockReturnValue(profileChain)
}

function makeRequest(body: object, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost/api/import/geo-units', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * Sets up the admin client to handle the geo-units insert flow.
 * The route calls admin.from() multiple times:
 *  1. insert(deptos) → { data: [{id, name}...], error: null }
 *  2. select existing deptos → { data: [{id, name}...] }
 *  3. insert(munics) → { data: [{id, name}...], error: null }
 *  4. select existing munics → { data: [] }
 *  5. insert(barrios) → { data: [{id, name}...], error: null }
 */
function setupAdmin(opts: {
  depto?: { id: string; name: string }[]
  munic?: { id: string; name: string }[]
  barrio?: { id: string; name: string }[]
} = {}) {
  let callCount = 0
  mockAdminSupabase.from = vi.fn().mockImplementation(() => {
    callCount++
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.not = vi.fn().mockReturnValue(chain)
    chain.delete = vi.fn().mockReturnValue(chain)
    chain.head = vi.fn().mockReturnValue(chain)

    // insert returns select-able chain
    chain.insert = vi.fn().mockImplementation(() => {
      const insertChain: Record<string, unknown> = {}
      const insertCount = callCount
      insertChain.select = vi.fn().mockImplementation(() => {
        // Determine which phase this is based on call order
        if (insertCount === 1) {
          return Promise.resolve({ data: opts.depto ?? [{ id: 'd1', name: 'Cundinamarca' }], error: null })
        } else if (insertCount === 3) {
          return Promise.resolve({ data: opts.munic ?? [{ id: 'm1', name: 'Bogotá' }], error: null })
        } else {
          return Promise.resolve({ data: opts.barrio ?? [{ id: 'b1', name: 'Chapinero' }], error: null })
        }
      })
      return insertChain
    })

    // Existing records fetch (calls 2 and 4): select → eq → eq → awaitable
    chain.then = (resolve: (v: { data: { id: string; name: string }[] }) => void) => {
      const data = callCount === 2 ? (opts.depto ?? [{ id: 'd1', name: 'Cundinamarca' }])
                 : callCount === 4 ? (opts.munic ?? [{ id: 'm1', name: 'Bogotá' }])
                 : []
      return Promise.resolve().then(() => resolve({ data }))
    }

    return chain
  })
}

// ── POST tests ─────────────────────────────────────────────────────────────────

describe('POST /api/import/geo-units', () => {
  it('returns 401 when not authenticated', async () => {
    mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for volunteer role', async () => {
    setupAuth('volunteer')
    const res = await POST(makeRequest({ rows: [{ tipo: 'departamento', nombre: 'X' }] }))
    expect(res.status).toBe(403)
  })

  it('returns 403 for analyst role', async () => {
    setupAuth('analyst')
    const res = await POST(makeRequest({ rows: [{ tipo: 'departamento', nombre: 'X' }] }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when no data provided', async () => {
    setupAuth('campaign_manager')
    const res = await POST(makeRequest({ rows: [] }))
    expect(res.status).toBe(400)
  })

  it('reports error for invalid tipo', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const res = await POST(makeRequest({ rows: [{ tipo: 'region', nombre: 'Norte' }] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.errors).toHaveLength(1)
    expect(json.errors[0]).toMatch(/tipo.*inválido/i)
    expect(json.imported).toBe(0)
  })

  it('accepts new Colombian types (localidad, upz, comuna, corregimiento, vereda)', async () => {
    setupAuth('campaign_manager')
    let callCount = 0
    mockAdminSupabase.from = vi.fn().mockImplementation(() => {
      callCount++
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.not = vi.fn().mockReturnValue(chain)
      chain.delete = vi.fn().mockReturnValue(chain)
      chain.head = vi.fn().mockReturnValue(chain)
      chain.insert = vi.fn().mockImplementation(() => {
        const ic: Record<string, unknown> = {}
        ic.select = vi.fn().mockResolvedValue({ data: [{ id: `id-${callCount}`, name: 'test' }], error: null })
        return ic
      })
      chain.then = (resolve: (v: { data: [] }) => void) =>
        Promise.resolve().then(() => resolve({ data: [] }))
      return chain
    })
    const rows = [
      { tipo: 'departamento',  nombre: 'Antioquia' },
      { tipo: 'municipio',     nombre: 'Medellín',    padre: 'Antioquia' },
      { tipo: 'localidad',     nombre: 'Usaquén',     padre: 'Bogotá' },
      { tipo: 'upz',           nombre: 'Verbenal',    padre: 'Usaquén' },
      { tipo: 'comuna',        nombre: 'Popular',     padre: 'Medellín' },
      { tipo: 'corregimiento', nombre: 'Altavista',   padre: 'Medellín' },
      { tipo: 'barrio',        nombre: 'El Jardín',   padre: 'Popular' },
      { tipo: 'vereda',        nombre: 'Aguas Frías', padre: 'Altavista' },
    ]
    const res = await POST(makeRequest({ rows }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.errors).toHaveLength(0)
  })

  it('reports error when nombre is missing', async () => {
    setupAuth('campaign_manager')
    setupAdmin()
    const res = await POST(makeRequest({ rows: [{ tipo: 'departamento' }] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.errors).toHaveLength(1)
    expect(json.errors[0]).toMatch(/nombre/i)
  })

  it('imports flat JSON with departamento + municipio + barrio', async () => {
    setupAuth('campaign_manager')
    setupAdmin({
      depto: [{ id: 'd1', name: 'Cundinamarca' }],
      munic: [{ id: 'm1', name: 'Bogotá' }],
      barrio: [{ id: 'b1', name: 'Chapinero' }],
    })

    const rows = [
      { tipo: 'departamento', nombre: 'Cundinamarca', codigo: '25' },
      { tipo: 'municipio', nombre: 'Bogotá', padre: 'Cundinamarca' },
      { tipo: 'barrio', nombre: 'Chapinero', padre: 'Bogotá' },
    ]
    const res = await POST(makeRequest({ rows }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.imported).toBe(3)
    expect(json.skipped).toBe(0)
    expect(json.errors).toHaveLength(0)
  })

  it('imports nested JSON format (departamento → municipios → barrios)', async () => {
    setupAuth('super_admin')
    setupAdmin({
      depto: [{ id: 'd1', name: 'Cundinamarca' }],
      munic: [{ id: 'm1', name: 'Bogotá' }],
      barrio: [{ id: 'b1', name: 'Chapinero' }],
    })

    const nested = [{
      nombre: 'Cundinamarca',
      codigo: '25',
      municipios: [{
        nombre: 'Bogotá',
        barrios: ['Chapinero'],
      }],
    }]
    const res = await POST(makeRequest({ rows: nested }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.imported).toBe(3)
  })

  it('counts as skipped when insert returns error (duplicate UNIQUE constraint)', async () => {
    setupAuth('campaign_manager')

    // Simulate insert error (duplicate) for deptos
    let callCount = 0
    mockAdminSupabase.from = vi.fn().mockImplementation(() => {
      callCount++
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.insert = vi.fn().mockImplementation(() => {
        const ic: Record<string, unknown> = {}
        ic.select = vi.fn().mockResolvedValue({ data: null, error: { message: 'duplicate key' } })
        return ic
      })
      // Existing records fetch
      chain.then = (resolve: (v: { data: [] }) => void) =>
        Promise.resolve().then(() => resolve({ data: [] }))
      return chain
    })

    const rows = [{ tipo: 'departamento', nombre: 'Cundinamarca' }]
    const res = await POST(makeRequest({ rows }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.skipped).toBe(1)
    expect(json.imported).toBe(0)
  })
})

// ── GET tests ──────────────────────────────────────────────────────────────────

describe('GET /api/import/geo-units', () => {
  it('returns 401 when not authenticated', async () => {
    mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost/api/import/geo-units')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns stats with zero counts when no campaign', async () => {
    mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const profileChain: Record<string, unknown> = {}
    profileChain.select = vi.fn().mockReturnValue(profileChain)
    profileChain.eq = vi.fn().mockReturnValue(profileChain)
    profileChain.single = vi.fn().mockResolvedValue({ data: { campaign_ids: [] } })
    mockUserSupabase.from = vi.fn().mockReturnValue(profileChain)

    const req = new NextRequest('http://localhost/api/import/geo-units')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ departamentos: 0, municipios: 0, localidades: 0, upzs: 0, comunas: 0, corregimientos: 0, barrios: 0, veredas: 0 })
  })
})

// ── DELETE tests ───────────────────────────────────────────────────────────────

describe('DELETE /api/import/geo-units', () => {
  it('returns 401 when not authenticated', async () => {
    mockUserSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('http://localhost/api/import/geo-units?confirm=true', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 without confirm param', async () => {
    setupAuth('campaign_manager')
    const req = new NextRequest('http://localhost/api/import/geo-units', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('returns 403 for volunteer role', async () => {
    setupAuth('volunteer')
    const req = new NextRequest('http://localhost/api/import/geo-units?confirm=true', { method: 'DELETE' })
    const res = await DELETE(req)
    expect(res.status).toBe(403)
  })
})
