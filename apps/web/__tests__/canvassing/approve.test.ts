import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockGetUser = vi.fn()
const mockProfileSingle = vi.fn()
const mockVisitSingle = vi.fn()
const capturedVisitUpdates: unknown[] = []
const capturedRejectUpdates: unknown[] = []

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
        update: vi.fn((data: unknown) => {
          const d = data as Record<string, unknown>
          if (d.status === 'rejected') capturedRejectUpdates.push(data)
          else capturedVisitUpdates.push(data)
          return {
            eq: vi.fn(() => ({
              error: null,
              select: vi.fn(() => ({ single: mockVisitSingle })),
            })),
          }
        }),
      }
    }),
  })),
}))

import { POST } from '@/app/api/canvassing/approve/route'

function makeRequest(body: Record<string, string>) {
  const formData = new FormData()
  Object.entries(body).forEach(([k, v]) => formData.append(k, v))
  return new NextRequest('http://localhost/api/canvassing/approve', {
    method: 'POST',
    body: formData,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  capturedVisitUpdates.length = 0
  capturedRejectUpdates.length = 0
  mockVisitSingle.mockResolvedValue({
    data: { contact_id: 'c1', sympathy_level: null, wants_to_volunteer: false, result: 'contacted' },
    error: null,
  })
})

describe('POST /api/canvassing/approve', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(makeRequest({ visitId: 'v1', action: 'approve' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is volunteer', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'volunteer' } })
    const res = await POST(makeRequest({ visitId: 'v1', action: 'approve' }))
    expect(res.status).toBe(403)
  })

  it('returns 400 when visitId is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'field_coordinator' } })
    const res = await POST(makeRequest({ action: 'approve' }))
    expect(res.status).toBe(400)
  })

  it('approves visit — redirects and sets status to approved', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'coord-1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'field_coordinator' } })

    const res = await POST(makeRequest({ visitId: 'v1', action: 'approve' }))
    expect(res.status).toBe(307)
    expect(capturedVisitUpdates[0]).toMatchObject({ status: 'approved' })
  })

  it('rejects visit — redirects and sets status to rejected with reason', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'coord-1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { role: 'campaign_manager' } })

    const res = await POST(makeRequest({ visitId: 'v2', action: 'reject', rejection_reason: 'Datos incorrectos' }))
    expect(res.status).toBe(307)
    expect(capturedRejectUpdates[0]).toMatchObject({ status: 'rejected', rejection_reason: 'Datos incorrectos' })
  })
})
