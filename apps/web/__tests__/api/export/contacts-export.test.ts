import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────────────────────────────
const { mockGetUser, mockProfileSingle } = vi.hoisted(() => ({
  mockGetUser:       vi.fn(),
  mockProfileSingle: vi.fn(),
}))

const mockContactsData = [
  {
    id: 'c1', first_name: 'Ana', last_name: 'García', email: 'ana@test.com',
    phone: '123', status: 'supporter', document_id: '12345', department: 'Bogotá',
    municipality: 'Bogotá', gender: 'F', tags: ['tag1'], created_at: '2024-01-01T00:00:00Z',
  },
]

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSingle })) })) }
      }
      // contacts
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({ data: mockContactsData, error: null }),
              })),
            })),
          })),
        })),
      }
    }),
  })),
}))

import { GET } from '@/app/api/export/contacts/route'

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/export/contacts')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

beforeEach(() => {
  vi.clearAllMocks()
  mockProfileSingle.mockResolvedValue({ data: { campaign_ids: ['camp-1'] } })
})

describe('GET /api/export/contacts', () => {
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
    expect(res.headers.get('content-disposition')).toContain('contactos.csv')
  })

  it('returns XLSX with correct Content-Type', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const res = await GET(makeRequest({ format: 'xlsx' }))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('spreadsheetml')
    expect(res.headers.get('content-disposition')).toContain('contactos.xlsx')
  })

  it('CSV body contains contact data', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    const res = await GET(makeRequest({ format: 'csv' }))
    const text = await res.text()
    expect(text).toContain('Ana')
    expect(text).toContain('García')
  })
})
