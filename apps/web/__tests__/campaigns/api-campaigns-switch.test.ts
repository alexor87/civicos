import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  mockGetUser,
  mockTenantUsersSelectEq,
  mockProfileSelectSingle,
  mockAdminProfilesUpdateEq,
  mockCookieSet,
} = vi.hoisted(() => ({
  mockGetUser:               vi.fn(),
  mockTenantUsersSelectEq:   vi.fn(),
  mockProfileSelectSingle:   vi.fn(),
  mockAdminProfilesUpdateEq: vi.fn(),
  mockCookieSet:             vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'tenant_users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => mockTenantUsersSelectEq()),
          })),
        }
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockProfileSelectSingle })),
          })),
        }
      }
      return {}
    }),
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          update: vi.fn(() => ({ eq: vi.fn(() => mockAdminProfilesUpdateEq()) })),
        }
      }
      return {}
    }),
  })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: mockCookieSet })),
}))

import { POST } from '@/app/api/campaigns/switch/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/campaigns/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/campaigns/switch — multi-tenant', () => {
  it('returns 400 when campaignId is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(makeRequest({ campaignId: 'c1' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when the campaign is not in any of the user memberships', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockTenantUsersSelectEq.mockResolvedValueOnce({
      data: [
        { tenant_id: 't_a', campaign_ids: ['c2'] },
        { tenant_id: 't_b', campaign_ids: ['c3'] },
      ],
    })

    const res = await POST(makeRequest({ campaignId: 'c1' }))
    expect(res.status).toBe(403)
  })

  it('intra-tenant switch: does NOT update profiles.active_tenant_id; sets only active_campaign_id cookie', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockTenantUsersSelectEq.mockResolvedValueOnce({
      data: [{ tenant_id: 't_a', campaign_ids: ['c1', 'c2'] }],
    })
    mockProfileSelectSingle.mockResolvedValueOnce({
      data: { active_tenant_id: 't_a' },
    })

    const res = await POST(makeRequest({ campaignId: 'c1' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true, tenant_changed: false, tenant_id: 't_a' })
    expect(mockAdminProfilesUpdateEq).not.toHaveBeenCalled()
    expect(mockCookieSet).toHaveBeenCalledWith(
      'active_campaign_id',
      'c1',
      expect.objectContaining({ httpOnly: true, path: '/' })
    )
    // Did NOT set active_tenant_id cookie
    expect(mockCookieSet).not.toHaveBeenCalledWith(
      'active_tenant_id',
      expect.anything(),
      expect.anything()
    )
  })

  it('cross-tenant switch: updates profiles.active_tenant_id, sets both cookies, returns tenant_changed=true', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockTenantUsersSelectEq.mockResolvedValueOnce({
      data: [
        { tenant_id: 't_a', campaign_ids: ['c2'] },
        { tenant_id: 't_b', campaign_ids: ['c1'] },
      ],
    })
    mockProfileSelectSingle.mockResolvedValueOnce({
      data: { active_tenant_id: 't_a' },
    })
    mockAdminProfilesUpdateEq.mockResolvedValueOnce({ error: null })

    const res = await POST(makeRequest({ campaignId: 'c1' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true, tenant_changed: true, tenant_id: 't_b' })
    expect(mockAdminProfilesUpdateEq).toHaveBeenCalled()
    expect(mockCookieSet).toHaveBeenCalledWith(
      'active_tenant_id',
      't_b',
      expect.objectContaining({ httpOnly: true, path: '/' })
    )
    expect(mockCookieSet).toHaveBeenCalledWith(
      'active_campaign_id',
      'c1',
      expect.objectContaining({ httpOnly: true, path: '/' })
    )
  })
})
