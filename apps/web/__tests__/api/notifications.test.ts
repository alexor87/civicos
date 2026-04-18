import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH } from '@/app/api/notifications/route'
import { NextRequest } from 'next/server'

// Mock Supabase server client
const mockSelect = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

const mockFrom = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: (...args: any[]) => mockFrom(...args),
  }),
}))

function buildChain(finalResult: any) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(finalResult),
    update: vi.fn().mockReturnThis(),
  }
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/notifications', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const req = new NextRequest('http://localhost/api/notifications')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns notifications and unread count', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const notificationsChain = buildChain({
      data: [{ id: 'n1', title: 'Test', read: false }],
      error: null,
    })

    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    // The last .eq() resolves the promise
    let eqCallCount = 0
    countChain.eq = vi.fn().mockImplementation(() => {
      eqCallCount++
      if (eqCallCount >= 2) {
        return Promise.resolve({ count: 3, error: null })
      }
      return countChain
    })

    let fromCallCount = 0
    mockFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) return notificationsChain
      return countChain
    })

    const req = new NextRequest('http://localhost/api/notifications')
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.notifications).toHaveLength(1)
    expect(body.unread_count).toBe(3)
  })
})

describe('PATCH /api/notifications', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ all: true }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(401)
  })

  it('returns 400 when body is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const updateChain = buildChain({ error: null })
    mockFrom.mockReturnValue(updateChain)

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ invalid: true }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
  })

  it('marks all as read when all: true', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const chain: any = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    }
    // Second .eq() resolves the promise
    let eqCount = 0
    chain.eq = vi.fn().mockImplementation(() => {
      eqCount++
      if (eqCount >= 2) return Promise.resolve({ error: null })
      return chain
    })

    mockFrom.mockReturnValue(chain)

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ all: true }),
    })
    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })

  it('marks specific ids as read', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const chain: any = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ error: null }),
    }

    mockFrom.mockReturnValue(chain)

    const req = new NextRequest('http://localhost/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ ids: ['n1', 'n2'] }),
    })
    const res = await PATCH(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
  })
})
