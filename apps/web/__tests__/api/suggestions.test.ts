import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockUpdate = vi.fn()
const mockSelect = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      update: mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ select: mockSelect }) }),
    })),
  })),
}))

import { PATCH } from '@/app/api/suggestions/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/suggestions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('PATCH /api/suggestions', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const res = await PATCH(makeRequest({ id: 'sug-1', action: 'approved' }))
    expect(res.status).toBe(401)
  })

  it('sets status=applied and applied_at when action is approved', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockSelect.mockResolvedValueOnce({ data: [{ id: 'sug-1' }], error: null })

    const res = await PATCH(makeRequest({ id: 'sug-1', action: 'approved' }))
    expect(res.status).toBe(200)

    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.status).toBe('applied')
    expect(updateCall.applied_at).toBeTruthy()
  })

  it('sets status=dismissed and dismissed_at when action is dismissed', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockSelect.mockResolvedValueOnce({ data: [{ id: 'sug-1' }], error: null })

    await PATCH(makeRequest({ id: 'sug-1', action: 'dismissed' }))

    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.status).toBe('dismissed')
    expect(updateCall.dismissed_at).toBeTruthy()
  })

  it('sets status=rejected and dismissed_at when action is rejected', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockSelect.mockResolvedValueOnce({ data: [{ id: 'sug-1' }], error: null })

    await PATCH(makeRequest({ id: 'sug-1', action: 'rejected' }))

    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.status).toBe('rejected')
    expect(updateCall.dismissed_at).toBeTruthy()
  })

  it('includes feedback in update when provided', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockSelect.mockResolvedValueOnce({ data: [{ id: 'sug-1' }], error: null })

    await PATCH(makeRequest({ id: 'sug-1', action: 'approved', feedback: 'Muy útil' }))

    const updateCall = mockUpdate.mock.calls[0][0]
    expect(updateCall.feedback).toBe('Muy útil')
  })

  it('returns 500 when DB update fails', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })
    mockSelect.mockResolvedValueOnce({ data: null, error: { message: 'DB failure' } })

    const res = await PATCH(makeRequest({ id: 'sug-1', action: 'approved' }))
    expect(res.status).toBe(500)
  })
})
