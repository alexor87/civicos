import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetUser,
  mockProfileSelect,
  mockCampaignSelect,
  mockCampaignUpdate,
} = vi.hoisted(() => ({
  mockGetUser:        vi.fn(),
  mockProfileSelect:  vi.fn(),
  mockCampaignSelect: vi.fn(),
  mockCampaignUpdate: vi.fn(),
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
          update: vi.fn((data: unknown) => ({
            eq: vi.fn(() => mockCampaignUpdate(data)),
          })),
        }
      }
      return {}
    }),
  })),
}))

import { PATCH } from '@/app/api/campaigns/thresholds/route'

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/campaigns/thresholds', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  campaign_id: 'camp1',
  thresholds: { visit_drop_pct: 25, coverage_low_pct: 35 },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockProfileSelect.mockResolvedValue({ data: null })
  mockCampaignSelect.mockResolvedValue({ data: { config: {} } })
  mockCampaignUpdate.mockReturnValue({ error: null })
})

describe('PATCH /api/campaigns/thresholds — auth', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await PATCH(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is analyst', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'analyst', campaign_ids: ['camp1'] } })
    const res = await PATCH(makeRequest(VALID_BODY))
    expect(res.status).toBe(403)
  })

  it('returns 403 when campaign_id not in user campaign_ids (non-super_admin)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'campaign_manager', campaign_ids: ['other-camp'] } })
    const res = await PATCH(makeRequest(VALID_BODY))
    expect(res.status).toBe(403)
  })

  it('super_admin can update any campaign', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'super_admin', campaign_ids: [] } })
    const res = await PATCH(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/campaigns/thresholds — validation', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'campaign_manager', campaign_ids: ['camp1'] } })
  })

  it('returns 400 when campaign_id missing', async () => {
    const res = await PATCH(makeRequest({ thresholds: { visit_drop_pct: 25 } }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when threshold value is zero or negative', async () => {
    const res = await PATCH(makeRequest({ campaign_id: 'camp1', thresholds: { visit_drop_pct: 0 } }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when campaign not found', async () => {
    mockCampaignSelect.mockResolvedValue({ data: null })
    const res = await PATCH(makeRequest(VALID_BODY))
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/campaigns/thresholds — happy path', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'campaign_manager', campaign_ids: ['camp1'] } })
  })

  it('merges partial thresholds with defaults', async () => {
    const res = await PATCH(makeRequest(VALID_BODY))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.thresholds.visit_drop_pct).toBe(25)
    expect(body.thresholds.coverage_low_pct).toBe(35)
    // defaults preserved
    expect(body.thresholds.inactive_contact_days).toBe(30)
    expect(body.thresholds.stale_draft_days).toBe(7)
  })

  it('preserves other config keys when saving', async () => {
    mockCampaignSelect.mockResolvedValue({ data: { config: { country: 'colombia', other_setting: true } } })
    await PATCH(makeRequest(VALID_BODY))
    expect(mockCampaignUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ country: 'colombia', other_setting: true }),
      })
    )
  })

  it('returns 500 when supabase update fails', async () => {
    mockCampaignUpdate.mockReturnValue({ error: { message: 'DB error' } })
    const res = await PATCH(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
  })
})
