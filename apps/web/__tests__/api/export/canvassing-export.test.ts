import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────────────────────
const { mockGetUser, mockProfileSingle } = vi.hoisted(() => ({
  mockGetUser:       vi.fn(),
  mockProfileSingle: vi.fn(),
}))

const mockVisitData = [
  {
    id: 'v1', result: 'contacted', sympathy_level: 4, vote_intention: 'yes',
    wants_to_volunteer: true, status: 'approved', rejection_reason: null,
    notes: 'Buena visita', created_at: '2024-01-01T00:00:00Z',
    contacts: { first_name: 'Ana', last_name: 'García' },
    profiles: { full_name: 'Voluntario Uno' },
    territories: { name: 'Zona Norte' },
  },
]

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSingle })) })) }
      }
      // canvass_visits
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue({ data: mockVisitData, error: null }),
            })),
          })),
        })),
      }
    }),
  })),
}))

import { GET } from '@/app/api/export/canvassing/route'

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/export/canvassing')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

beforeEach(() => {
  vi.clearAllMocks()
  mockProfileSingle.mockResolvedValue({ data: { campaign_ids: ['camp-1'] } })
})

describe('GET /api/export/canvassing', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it('returns CSV with correct Content-Type', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const res = await GET(makeRequest({ format: 'csv' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/csv')
    expect(res.headers.get('content-disposition')).toContain('visitas-canvassing.csv')
  })

  it('returns XLSX with correct Content-Type', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const res = await GET(makeRequest({ format: 'xlsx' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('spreadsheetml')
    expect(res.headers.get('content-disposition')).toContain('visitas-canvassing.xlsx')
  })

  it('CSV body contains visit data', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const res = await GET(makeRequest({ format: 'csv' }))
    const text = await res.text()
    expect(text).toContain('Ana García')
    expect(text).toContain('Zona Norte')
    expect(text).toContain('Voluntario Uno')
  })
})
