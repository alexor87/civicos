import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockUpdate, mockEq, mockFrom, mockGetUser, mockProfile } = vi.hoisted(() => {
  const mockUpdate  = vi.fn()
  const mockEq      = vi.fn().mockReturnValue({ eq: vi.fn() })
  const mockFrom    = vi.fn()
  const mockGetUser = vi.fn()
  const mockProfile = vi.fn()
  return { mockUpdate, mockEq, mockFrom, mockGetUser, mockProfile }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { PATCH } from '@/app/api/settings/campaign/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/settings/campaign', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const CAMPAIGN_ID = 'camp-001'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/settings/campaign — branding fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    // from('profiles').select(...).eq() → profile
    mockProfile.mockResolvedValue({
      data: {
        campaign_ids: [CAMPAIGN_ID],
        role: 'super_admin',
      },
      error: null,
    })

    // from('campaigns').update(...).eq() → success
    const eqFinal = vi.fn().mockResolvedValue({ error: null })
    mockEq.mockReturnValue({ eq: eqFinal })
    mockUpdate.mockReturnValue({ eq: mockEq })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockProfile,
            }),
          }),
        }
      }
      if (table === 'campaigns') {
        return { update: mockUpdate }
      }
      return {}
    })
  })

  it('saves slogan when provided', async () => {
    await PATCH(makeRequest({
      campaign_id: CAMPAIGN_ID,
      name: 'Mi campaña',
      slogan: 'Juntos construimos el futuro',
    }))

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ slogan: 'Juntos construimos el futuro' })
    )
  })

  it('saves logo_url when provided', async () => {
    await PATCH(makeRequest({
      campaign_id: CAMPAIGN_ID,
      name: 'Mi campaña',
      logo_url: 'https://cdn.example.com/photo.jpg',
    }))

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ logo_url: 'https://cdn.example.com/photo.jpg' })
    )
  })

  it('saves brand_color when provided', async () => {
    await PATCH(makeRequest({
      campaign_id: CAMPAIGN_ID,
      name: 'Mi campaña',
      brand_color: '#dc2626',
    }))

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ brand_color: '#dc2626' })
    )
  })

  it('sets slogan to null when not provided', async () => {
    await PATCH(makeRequest({
      campaign_id: CAMPAIGN_ID,
      name: 'Mi campaña',
    }))

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ slogan: null })
    )
  })

  it('returns 200 on success', async () => {
    const res = await PATCH(makeRequest({
      campaign_id: CAMPAIGN_ID,
      name: 'Mi campaña',
      slogan: 'Test slogan',
      logo_url: 'https://example.com/img.png',
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await PATCH(makeRequest({ campaign_id: CAMPAIGN_ID, name: 'x' }))
    expect(res.status).toBe(401)
  })
})
