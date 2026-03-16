import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetUser,
  mockProfileSelect,
  mockCampaignSelect,
  mockCampaignUpdate,
  mockGeoSelect,
} = vi.hoisted(() => ({
  mockGetUser:        vi.fn(),
  mockProfileSelect:  vi.fn(),
  mockCampaignSelect: vi.fn(),
  mockCampaignUpdate: vi.fn(),
  mockGeoSelect:      vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSelect })) })) }
      }
      if (table === 'campaigns') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSelect })) })),
          update: vi.fn(() => ({ eq: vi.fn(() => mockCampaignUpdate()) })),
        }
      }
      if (table === 'geo_units') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => mockGeoSelect()),
                })),
                order: vi.fn(() => mockGeoSelect()),
              })),
            })),
          })),
        }
      }
      return {}
    }),
  })),
}))

import { GET, PATCH } from '@/app/api/campaigns/scope/route'

const CAMPAIGN_ID = 'camp-1'

function makeGet() {
  return new NextRequest('http://localhost/api/campaigns/scope', { method: 'GET' })
}
function makePatch(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/campaigns/scope', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockProfileSelect.mockResolvedValue({ data: null })
  mockCampaignSelect.mockResolvedValue({ data: null, error: null })
  mockCampaignUpdate.mockReturnValue({ error: null })
  mockGeoSelect.mockResolvedValue({ data: [] })
})

// ── GET ───────────────────────────────────────────────────────────────────────
describe('GET /api/campaigns/scope', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await GET(makeGet())
    expect(res.status).toBe(401)
  })

  it('returns scope with departments when authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({
      data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' },
    })
    mockCampaignSelect.mockResolvedValue({
      data: { id: CAMPAIGN_ID, config: { election_type: 'alcalde', geo_scope: { department_id: 'dept-1', department_name: 'Antioquia' } } },
      error: null,
    })
    mockGeoSelect.mockResolvedValue({
      data: [{ id: 'dept-1', name: 'Antioquia', code: '05' }],
    })
    const res = await GET(makeGet())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.election_type).toBe('alcalde')
    expect(body.departments).toHaveLength(1)
    expect(body.departments[0].name).toBe('Antioquia')
  })

  it('returns municipalities when geo_scope has department_id', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({
      data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' },
    })
    mockCampaignSelect.mockResolvedValue({
      data: { id: CAMPAIGN_ID, config: { election_type: 'alcalde', geo_scope: { department_id: 'dept-1' } } },
      error: null,
    })
    // First call returns departments, second returns municipalities
    mockGeoSelect
      .mockResolvedValueOnce({ data: [{ id: 'dept-1', name: 'Antioquia', code: '05' }] })
      .mockResolvedValueOnce({ data: [{ id: 'mun-1', name: 'Medellín' }] })
    const res = await GET(makeGet())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.municipalities).toHaveLength(1)
    expect(body.municipalities[0].name).toBe('Medellín')
  })
})

// ── PATCH ─────────────────────────────────────────────────────────────────────
describe('PATCH /api/campaigns/scope', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await PATCH(makePatch({ election_type: 'alcalde' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for volunteer role', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({
      data: { campaign_ids: [CAMPAIGN_ID], role: 'volunteer' },
    })
    const res = await PATCH(makePatch({ election_type: 'alcalde' }))
    expect(res.status).toBe(403)
  })

  it('returns 200 and updates campaign config', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({
      data: { campaign_ids: [CAMPAIGN_ID], role: 'campaign_manager' },
    })
    mockCampaignSelect.mockResolvedValue({
      data: { id: CAMPAIGN_ID, config: {} },
      error: null,
    })
    const res = await PATCH(makePatch({
      election_type: 'gobernador',
      geo_scope: { department_id: 'dept-1', department_name: 'Antioquia' },
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })
})
