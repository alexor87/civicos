import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ──────────────────────────────────────────────────────────────

const mockSelect    = vi.fn()
const mockInsert    = vi.fn()
const mockUpdate    = vi.fn()
const mockEq        = vi.fn()
const mockNeq       = vi.fn()
const mockGte       = vi.fn()
const mockLt        = vi.fn()
const mockOrder     = vi.fn()
const mockSingle    = vi.fn()
const mockGetUser   = vi.fn()

function makeChain(data: unknown, error: unknown = null) {
  const chain = {
    select:  () => chain,
    insert:  () => chain,
    update:  () => chain,
    eq:      () => chain,
    neq:     () => chain,
    gte:     () => chain,
    lt:      () => chain,
    order:   () => chain,
    single:  async () => ({ data, error }),
    // awaitable at end of chain
    then:    (resolve: (v: { data: unknown; error: unknown }) => void) => resolve({ data, error }),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => ({
      select:  (...args: unknown[]) => makeChain(
        table === 'profiles'
          ? { campaign_ids: ['camp-1'], tenant_id: 'tenant-1' }
          : table === 'calendar_events'
          ? [{ id: 'evt-1', title: 'Test Event', start_at: '2026-03-15T09:00:00Z' }]
          : [],
      ),
      insert:  (...args: unknown[]) => ({
        select: () => ({ single: async () => ({ data: { id: 'new-evt', title: 'New Event' }, error: null }) }),
      }),
      update:  () => ({
        eq: () => ({
          select: () => ({ single: async () => ({ data: { id: 'evt-1' }, error: null }) }),
          then:   (r: (v: { data: unknown; error: unknown }) => void) => r({ data: { id: 'evt-1' }, error: null }),
        }),
      }),
    })),
  })),
}))

// ── Import routes ──────────────────────────────────────────────────────────────

import { GET, POST } from '@/app/api/calendar/events/route'

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init)
}

beforeEach(() => {
  mockGetUser.mockReset()
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('GET /api/calendar/events', () => {

  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const req = makeRequest('http://localhost/api/calendar/events?month=2026-03')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('devuelve array de eventos para un mes dado', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    const req = makeRequest('http://localhost/api/calendar/events?month=2026-03')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('devuelve array vacío sin parámetro de mes', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    const req = makeRequest('http://localhost/api/calendar/events')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})

describe('POST /api/calendar/events', () => {

  it('devuelve 401 sin autenticación', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const req = makeRequest('http://localhost/api/calendar/events', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: 'Test', start_at: '2026-03-15T09:00:00Z', end_at: '2026-03-15T11:00:00Z' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('crea un evento y devuelve 201', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    const req = makeRequest('http://localhost/api/calendar/events', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        title:     'Nuevo Mitin',
        event_type: 'public_event',
        start_at:  '2026-03-20T09:00:00Z',
        end_at:    '2026-03-20T12:00:00Z',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body).toHaveProperty('id')
  })
})
