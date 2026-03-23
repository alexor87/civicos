import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoisted mocks (must be defined before vi.mock factory runs) ────────────────

const { mockSingle, mockEq, mockSelect, mockFrom, mockGetUser } = vi.hoisted(() => {
  const mockSingle  = vi.fn()
  const mockEq      = vi.fn().mockReturnValue({ single: mockSingle })
  const mockSelect  = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom    = vi.fn().mockReturnValue({ select: mockSelect })
  const mockGetUser = vi.fn()
  return { mockSingle, mockEq, mockSelect, mockFrom, mockGetUser }
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

const MOCK_VISIT = {
  id: VISIT_ID,
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/canvassing/visits/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValue({ data: MOCK_VISIT, error: null })
  })

  it('returns the visit when authenticated', async () => {
    const res = await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(VISIT_ID)
    expect(body.result).toBe('contacted')
    expect(body.contacts).toEqual({ first_name: 'Ana', last_name: 'García' })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    expect(res.status).toBe(401)
  })

  it('returns 404 when visit not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Row not found' } })
    const res = await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    expect(res.status).toBe(404)
  })

  it('queries the correct visit id', async () => {
    await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    expect(mockEq).toHaveBeenCalledWith('id', VISIT_ID)
  })

  it('selects related contacts, profiles, and territories', async () => {
    await GET(makeRequest(VISIT_ID), { params: Promise.resolve({ id: VISIT_ID }) })
    expect(mockSelect).toHaveBeenCalledWith(
      '*, contacts(first_name, last_name), profiles!volunteer_id(full_name), territories(name)'
    )
  })
})
