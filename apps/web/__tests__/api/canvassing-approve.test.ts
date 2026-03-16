import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockGetUser = vi.fn()
const mockProfileSingle = vi.fn()
const mockVisitSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSingle })) })) }
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { metadata: {} } }) })) })),
          update: vi.fn(() => ({ eq: vi.fn(() => ({})) })),
        }
      }
      // canvass_visits
      return {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            // for reject path: direct error
            error: null,
            // for approve path: .select().single()
            select: vi.fn(() => ({ single: mockVisitSingle })),
          })),
        })),
      }
    }),
  })),
}))

import { POST } from '@/app/api/canvassing/approve/route'

function makeFormRequest(visitId: string, action = 'approve', rejectionReason?: string) {
  const form = new FormData()
  form.append('visitId', visitId)
  form.append('action', action)
  if (rejectionReason) form.append('rejection_reason', rejectionReason)
  return new NextRequest('http://localhost/dashboard/canvassing', {
    method: 'POST',
    body: form,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockVisitSingle.mockResolvedValue({
    data: { contact_id: 'c1', sympathy_level: null, wants_to_volunteer: false, result: 'contacted' },
    error: null,
  })
})

describe('POST /api/canvassing/approve', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const res = await POST(makeFormRequest('visit-1'))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user is a volunteer', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'volunteer' } })

    const res = await POST(makeFormRequest('visit-1'))
    expect(res.status).toBe(403)
  })

  it('returns 403 when user is an analyst', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'analyst' } })

    const res = await POST(makeFormRequest('visit-1'))
    expect(res.status).toBe(403)
  })

  it('redirects to canvassing page when field_coordinator approves', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'field_coordinator' } })

    const res = await POST(makeFormRequest('visit-1'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/dashboard/canvassing')
  })

  it('redirects to canvassing page when super_admin approves', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'super_admin' } })

    const res = await POST(makeFormRequest('visit-99'))
    expect(res.status).toBe(307)
  })

  it('redirects after rejecting a visit', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })

    const res = await POST(makeFormRequest('visit-1', 'reject', 'Datos incorrectos'))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/dashboard/canvassing')
  })
})
