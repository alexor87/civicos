import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGetUser, mockFrom, mockSelect, mockEq, mockSingle, mockUpdate, mockGetActiveCampaignContext } = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) }) })
  const mockFrom = vi.fn()
  const mockGetUser = vi.fn()
  const mockGetActiveCampaignContext = vi.fn()
  return { mockGetUser, mockFrom, mockSelect, mockEq, mockSingle, mockUpdate, mockGetActiveCampaignContext }
})

vi.mock('@/lib/auth/active-campaign-context', () => ({
  getActiveCampaignContext: mockGetActiveCampaignContext,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { GET, PATCH } from '@/app/api/profile/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const PROFILE = {
  id: 'user-1',
  full_name: 'Juan Pérez',
  short_name: null,
  phone: null,
  custom_title: null,
  avatar_url: null,
  language: 'es_CO',
  timezone: 'America/Bogota',
  theme_mode: 'system',
  font_size: 'normal',
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockGetActiveCampaignContext.mockResolvedValue({
      activeTenantId:   'tenant-1',
      campaignIds:      ['camp-1'],
      activeCampaignId: 'camp-1',
      role:             'super_admin',
      customRoleId:     null,
    })
  })

  it('returns 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns profile data', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: PROFILE, error: null })
        })
      })
    })
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.full_name).toBe('Juan Pérez')
  })
})

describe('PATCH /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('returns 401 if not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const res = await PATCH(makeRequest({ full_name: 'Test User' }) as any)
    expect(res.status).toBe(401)
  })

  it('returns 400 for empty updates', async () => {
    const res = await PATCH(makeRequest({ invalid_field: 'test' }) as any)
    expect(res.status).toBe(400)
  })

  it('validates full_name requires at least 2 words', async () => {
    const res = await PATCH(makeRequest({ full_name: 'Juan' }) as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('2 palabras')
  })

  it('validates phone format E.164', async () => {
    const res = await PATCH(makeRequest({ phone: '12345' }) as any)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('E.164')
  })

  it('validates language values', async () => {
    const res = await PATCH(makeRequest({ language: 'invalid' }) as any)
    expect(res.status).toBe(400)
  })

  it('validates theme_mode values', async () => {
    const res = await PATCH(makeRequest({ theme_mode: 'invalid' }) as any)
    expect(res.status).toBe(400)
  })

  it('validates font_size values', async () => {
    const res = await PATCH(makeRequest({ font_size: 'invalid' }) as any)
    expect(res.status).toBe(400)
  })

  it('accepts valid profile update', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { ...PROFILE, full_name: 'María López García' }, error: null })
          })
        })
      })
    })
    const res = await PATCH(makeRequest({ full_name: 'María López García' }) as any)
    expect(res.status).toBe(200)
  })

  it('accepts valid phone in E.164 format', async () => {
    mockFrom.mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { ...PROFILE, phone: '+573001234567' }, error: null })
          })
        })
      })
    })
    const res = await PATCH(makeRequest({ phone: '+573001234567' }) as any)
    expect(res.status).toBe(200)
  })
})
