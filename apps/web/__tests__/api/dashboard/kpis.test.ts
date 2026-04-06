import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/dashboard/kpis/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

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

function setupFromCalls(profileData: object | null, statsData: object | null, statsError?: object | null) {
  let callIndex = 0
  mockSupabase.from = vi.fn().mockImplementation(() => {
    callIndex++
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    if (callIndex === 1) {
      // profiles query
      chain.single = vi.fn().mockResolvedValue({ data: profileData })
    } else {
      // campaign_stats query
      chain.single = vi.fn().mockResolvedValue({
        data: statsData,
        error: statsError ?? null,
      })
    }
    return chain
  })
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

  it('returns correct KPI structure from campaign_stats', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    setupFromCalls(
      { campaign_ids: ['c1'] },
      { total_contacts: 10, supporters: 4, total_visits: 8, pending_visits: 2 },
    )

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
    setupFromCalls(
      { campaign_ids: ['c1'] },
      { total_contacts: 0, supporters: 0, total_visits: 0, pending_visits: 0 },
    )

    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.supportRate).toBe(0)
    expect(json.coverageRate).toBe(0)
  })

  it('returns 403 if user does not own the campaign', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    setupFromCalls({ campaign_ids: ['other-campaign'] }, null)
    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(403)
  })

  it('returns zeros when campaign has no stats row (new campaign)', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    setupFromCalls(
      { campaign_ids: ['c1'] },
      null,
      { code: 'PGRST116', message: 'not found' },
    )

    const res = await GET(makeRequest('c1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.totalContacts).toBe(0)
    expect(json.supporters).toBe(0)
    expect(json.totalVisits).toBe(0)
    expect(json.pendingVisits).toBe(0)
  })
})
