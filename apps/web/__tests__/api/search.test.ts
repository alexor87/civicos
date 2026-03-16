import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/search/route'

const mockSelect = vi.fn()
const mockEq     = vi.fn()
const mockOr     = vi.fn()
const mockIlike  = vi.fn()
const mockLimit  = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'user-1' } } })),
    },
    from: vi.fn((table: string) => {
      const chain = {
        select: mockSelect.mockReturnThis(),
        eq:     mockEq.mockReturnThis(),
        or:     mockOr.mockReturnThis(),
        ilike:  mockIlike.mockReturnThis(),
        limit:  mockLimit,
      }
      if (table === 'profiles') {
        chain.limit = vi.fn().mockResolvedValue({ data: null })
        chain.select = vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { campaign_ids: ['camp-1'] },
            }),
          }),
        })
      } else if (table === 'contacts') {
        chain.limit = vi.fn().mockResolvedValue({
          data: [{ id: 'c1', first_name: 'Ana', last_name: 'García', email: 'ana@test.com', phone: null }],
        })
      } else if (table === 'territories') {
        chain.limit = vi.fn().mockResolvedValue({
          data: [{ id: 't1', name: 'Barrio Norte' }],
        })
      }
      return chain
    }),
  })),
}))

function makeRequest(q: string) {
  return new Request(`http://localhost/api/search?q=${encodeURIComponent(q)}`)
}

describe('GET /api/search', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve arrays vacíos si q tiene menos de 2 caracteres', async () => {
    const res  = await GET(makeRequest('a'))
    const body = await res.json()
    expect(body.contacts).toEqual([])
    expect(body.territories).toEqual([])
  })

  it('devuelve arrays vacíos si q está vacío', async () => {
    const res  = await GET(makeRequest(''))
    const body = await res.json()
    expect(body.contacts).toEqual([])
    expect(body.territories).toEqual([])
  })

  it('devuelve contactos y territorios cuando q >= 2 chars', async () => {
    const res  = await GET(makeRequest('Ana'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contacts).toBeDefined()
    expect(body.territories).toBeDefined()
  })

  it('devuelve 401 si el usuario no está autenticado', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockReturnValueOnce({
      auth: { getUser: vi.fn(() => ({ data: { user: null } })) },
      from: vi.fn(),
    } as any)
    const res = await GET(makeRequest('Ana'))
    expect(res.status).toBe(401)
  })
})
