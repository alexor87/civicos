import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOr = vi.fn()
const mockLimit = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: { campaign_ids: ['camp-1'] } }),
            })),
          })),
        }
      }
      return { select: mockSelect }
    },
  })),
}))

import { GET } from '@/app/api/contacts/search/route'

describe('GET /api/contacts/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ or: mockOr })
    mockOr.mockReturnValue({ limit: mockLimit })
    mockLimit.mockResolvedValue({
      data: [{ id: '1', first_name: 'Ana', last_name: 'Gómez', phone: '300123' }],
    })
  })

  it('returns empty when no query param', async () => {
    const req = new Request('http://localhost/api/contacts/search')
    const res = await GET(req)
    const json = await res.json()
    expect(json.results).toEqual([])
  })

  it('returns empty when no campaign_id param', async () => {
    const req = new Request('http://localhost/api/contacts/search?q=Ana')
    const res = await GET(req)
    const json = await res.json()
    expect(json.results).toEqual([])
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const req = new Request('http://localhost/api/contacts/search?q=Ana&campaign_id=camp-1')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns search results', async () => {
    const req = new Request('http://localhost/api/contacts/search?q=Ana&campaign_id=camp-1')
    const res = await GET(req)
    const json = await res.json()
    expect(json.results).toHaveLength(1)
    expect(json.results[0].first_name).toBe('Ana')
  })

  it('searches with ilike on first_name and last_name', async () => {
    const req = new Request('http://localhost/api/contacts/search?q=Ana&campaign_id=camp-1')
    await GET(req)
    expect(mockSelect).toHaveBeenCalledWith('id, first_name, last_name, phone')
    expect(mockEq).toHaveBeenCalledWith('campaign_id', 'camp-1')
    expect(mockOr).toHaveBeenCalledWith('first_name.ilike.%Ana%,last_name.ilike.%Ana%')
    expect(mockLimit).toHaveBeenCalledWith(5)
  })
})
