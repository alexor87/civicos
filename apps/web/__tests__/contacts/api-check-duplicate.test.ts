import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

import { GET } from '@/app/api/contacts/check-duplicate/route'

describe('GET /api/contacts/check-duplicate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns 400 when document_number missing', async () => {
    const req = new Request('http://localhost/api/contacts/check-duplicate?campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when campaign_id missing', async () => {
    const req = new Request('http://localhost/api/contacts/check-duplicate?document_number=123')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new Request('http://localhost/api/contacts/check-duplicate?document_number=123&campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns duplicate: false when no match', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({
              single: () => Promise.resolve({ data: null }),
            }),
          }),
        }),
      }),
    })

    const req = new Request('http://localhost/api/contacts/check-duplicate?document_number=123&campaign_id=camp-1')
    const res = await GET(req)
    const json = await res.json()
    expect(json.duplicate).toBe(false)
  })

  it('returns duplicate: true when match found', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({
              single: () => Promise.resolve({
                data: { id: 'existing-id', first_name: 'Juan', last_name: 'Pérez' },
              }),
            }),
          }),
        }),
      }),
    })

    const req = new Request('http://localhost/api/contacts/check-duplicate?document_number=123&campaign_id=camp-1')
    const res = await GET(req)
    const json = await res.json()
    expect(json.duplicate).toBe(true)
    expect(json.contact.id).toBe('existing-id')
  })

  it('supports exclude_id parameter', async () => {
    const mockNeq = vi.fn().mockReturnValue({
      single: () => Promise.resolve({ data: null }),
    })

    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({
              neq: mockNeq,
              single: () => Promise.resolve({ data: null }),
            }),
          }),
        }),
      }),
    })

    const req = new Request('http://localhost/api/contacts/check-duplicate?document_number=123&campaign_id=camp-1&exclude_id=self-id')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockNeq).toHaveBeenCalledWith('id', 'self-id')
  })
})
