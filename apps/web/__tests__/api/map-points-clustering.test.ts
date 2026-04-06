import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/canvassing/map-points/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
  rpc: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
})

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const sp = new URLSearchParams(params)
  return new NextRequest(`http://localhost/api/canvassing/map-points?${sp}`)
}

function setupAuth(campaignIds: string[] = ['c1']) {
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  mockSupabase.from = vi.fn().mockImplementation(() => {
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({
      data: { campaign_ids: campaignIds },
    })
    return chain
  })
}

describe('GET /api/canvassing/map-points — clustered contacts', () => {
  it('returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const res = await GET(makeRequest({ campaignId: 'c1', minLat: '4', minLng: '-75', maxLat: '5', maxLng: '-74', zoom: '10' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 if missing required params', async () => {
    setupAuth()
    const res = await GET(makeRequest({ campaignId: 'c1' }))
    expect(res.status).toBe(400)
  })

  it('returns 403 if user does not own campaign', async () => {
    setupAuth(['other-campaign'])
    const res = await GET(makeRequest({
      campaignId: 'c1', minLat: '4', minLng: '-75', maxLat: '5', maxLng: '-74', zoom: '10',
    }))
    expect(res.status).toBe(403)
  })

  it('calls get_clustered_contacts RPC with correct params', async () => {
    setupAuth(['c1'])
    const mockClusters = [
      { cluster_id: 'abc', lat: 4.5, lng: -74.5, point_count: 150, contact_id: null, dominant_status: 'supporter', dominant_result: 'positive' },
      { cluster_id: 'def', lat: 4.7, lng: -74.2, point_count: 1, contact_id: 'contact-uuid-1', dominant_status: 'undecided', dominant_result: null },
    ]
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: mockClusters, error: null })

    const res = await GET(makeRequest({
      campaignId: 'c1', minLat: '4', minLng: '-75', maxLat: '5', maxLng: '-74', zoom: '12',
    }))

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].point_count).toBe(150)
    expect(data[1].contact_id).toBe('contact-uuid-1')

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_clustered_contacts', {
      p_campaign_id: 'c1',
      p_min_lat: 4,
      p_min_lng: -75,
      p_max_lat: 5,
      p_max_lng: -74,
      p_zoom: 12,
    })
  })

  it('clamps zoom to valid range (1-20)', async () => {
    setupAuth(['c1'])
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: [], error: null })

    await GET(makeRequest({
      campaignId: 'c1', minLat: '4', minLng: '-75', maxLat: '5', maxLng: '-74', zoom: '25',
    }))

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_clustered_contacts', expect.objectContaining({
      p_zoom: 20,
    }))
  })

  it('returns 500 on RPC error', async () => {
    setupAuth(['c1'])
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'function not found' } })

    const res = await GET(makeRequest({
      campaignId: 'c1', minLat: '4', minLng: '-75', maxLat: '5', maxLng: '-74', zoom: '10',
    }))
    expect(res.status).toBe(500)
  })
})
