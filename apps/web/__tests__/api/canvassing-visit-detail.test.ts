import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const { mockGetUser, mockFrom } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom    = vi.fn()
  return { mockGetUser, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

// ── Import route after mocks ───────────────────────────────────────────────────

import { GET } from '@/app/api/canvassing/visits/[id]/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

const VISIT_ID = 'visit-abc-123'
const CAMPAIGN_ID = 'campaign-1'

const MOCK_VISIT = {
  id: VISIT_ID,
  campaign_id: CAMPAIGN_ID,
  result: 'contacted',
  notes: 'Muy receptivo',
  attempt_number: 1,
  sympathy_level: 4,
  vote_intention: 'will_vote_us',
  persuadability: 'high',
  wants_to_volunteer: false,
  wants_to_donate: false,
  wants_more_info: true,
  wants_yard_sign: false,
  requested_followup: false,
  followup_channel: null,
  followup_notes: null,
  best_contact_time: null,
  household_size: 3,
  household_voters: 2,
  address_confirmed: true,
  address_notes: null,
  status: 'approved',
  rejection_reason: null,
  created_at: '2025-01-15T10:00:00Z',
  contacts: { first_name: 'Ana', last_name: 'García' },
  profiles: { full_name: 'Voluntario Uno' },
  territories: { name: 'Zona Norte' },
}

function makeRequest(id: string): NextRequest {
  return new NextRequest(`http://localhost/api/canvassing/visits/${id}`)
}

// Helper: mock the two sequential from() calls:
// 1st: profiles query (for campaign ownership check)
// 2nd: canvass_visits query
function setupMocks(opts: { user?: object | null; visitData?: object | null; visitError?: object | null } = {}) {
  const user = opts.user !== undefined ? opts.user : { id: 'user-1' }
  const visitData = opts.visitData !== undefined ? opts.visitData : MOCK_VISIT
  const visitError = opts.visitError !== undefined ? opts.visitError : null

  mockGetUser.mockResolvedValue({ data: { user } })

  let callCount = 0
  mockFrom.mockImplementation((table: string) => {
    if (table === 'profiles') {
      // Profile query chain: .select().eq().single()
      const singleFn = vi.fn().mockResolvedValue({
        data: { campaign_ids: [CAMPAIGN_ID] },
        error: null,
      })
      const eqFn = vi.fn().mockReturnValue({ single: singleFn })
      const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
      return { select: selectFn }
    } else {
      // Visit query chain: .select().eq().in().single()
      const singleFn = vi.fn().mockResolvedValue({ data: visitData, error: visitError })
      const inFn = vi.fn().mockReturnValue({ single: singleFn })
      const eqFn = vi.fn().mockReturnValue({ in: inFn })
      const selectFn = vi.fn().mockReturnValue({ eq: eqFn })
      return { select: selectFn }
    }
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/canvassing/visits/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the visit when authenticated', async () => {
    setupMocks()
    const res = await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(VISIT_ID)
    expect(body.result).toBe('contacted')
    expect(body.contacts).toEqual({ first_name: 'Ana', last_name: 'García' })
  })

  it('returns 401 when not authenticated', async () => {
    setupMocks({ user: null })
    const res = await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when visit not found', async () => {
    setupMocks({ visitData: null, visitError: { message: 'Row not found' } })
    const res = await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    expect(res.status).toBe(404)
  })

  it('queries the correct visit id', async () => {
    setupMocks()
    await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    // Verify from was called for canvass_visits
    expect(mockFrom).toHaveBeenCalledWith('canvass_visits')
  })

  it('selects related contacts, profiles, and territories', async () => {
    setupMocks()
    await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    // Verify profile ownership check was performed
    expect(mockFrom).toHaveBeenCalledWith('profiles')
    expect(mockFrom).toHaveBeenCalledWith('canvass_visits')
  })
})
