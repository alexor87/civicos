import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/dashboard/kpis/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

function makeChain(count: number) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  // Make awaitable
  chain.then = (resolve: (v: { count: number; error: null }) => void) =>
    Promise.resolve().then(() => resolve({ count, error: null }))
  return chain
}

const mockProfileChain = (campaignIds: string[] | null) => {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.single = vi.fn().mockResolvedValue({ data: campaignIds ? { campaign_ids: campaignIds } : null })
  return chain
}

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
})

function makeRequest(campaignId?: string): NextRequest {
  const url = campaignId
    ? `http://localhost/api/dashboard/kpis?campaignId=${campaignId}`
    : 'http://localhost/api/dashboard/kpis'
  return new NextRequest(url)
}

describe('GET /api/dashboard/kpis', () => {
  it('returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(401)
  })

  it('returns 400 if campaignId is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns correct KPI structure for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    // First from() call is profiles (ownership check)
    mockSupabase.from.mockReturnValueOnce(mockProfileChain(['c1']))

    // 4 calls: totalContacts=10, supporters=4, pendingVisits=2, totalVisits=8
    const counts = [10, 4, 2, 8]
    let i = 0
    mockSupabase.from.mockImplementation(() => makeChain(counts[i++] ?? 0))

    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.totalContacts).toBe(10)
    expect(json.supporters).toBe(4)
    expect(json.pendingVisits).toBe(2)
    expect(json.totalVisits).toBe(8)
    expect(json.supportRate).toBe(40) // 4/10 = 40%
    expect(json.coverageRate).toBe(80) // 8/10 = 80%
  })

  it('returns zero rates when totalContacts is 0', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    // First from() call is profiles (ownership check)
    mockSupabase.from.mockReturnValueOnce(mockProfileChain(['c1']))

    mockSupabase.from.mockImplementation(() => makeChain(0))

    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.supportRate).toBe(0)
    expect(json.coverageRate).toBe(0)
  })

  it('returns 403 if user does not own the campaign', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    // First from() call is profiles query
    mockSupabase.from.mockReturnValueOnce(mockProfileChain(['other-campaign']))
    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(403)
  })

  it('returns 500 if a DB query fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    // First from() is profiles (success), then count queries (one fails)
    mockSupabase.from.mockReturnValueOnce(mockProfileChain(['c1']))

    const failChain: Record<string, unknown> = {}
    failChain.select = vi.fn().mockReturnValue(failChain)
    failChain.eq = vi.fn().mockReturnValue(failChain)
    failChain.is = vi.fn().mockReturnValue(failChain)
    failChain.then = (resolve: (v: { count: null; error: { message: string } }) => void) =>
      Promise.resolve().then(() => resolve({ count: null, error: { message: 'DB error' } }))

    // All 4 count queries fail
    mockSupabase.from.mockImplementation(() => failChain)

    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(500)
  })
})
