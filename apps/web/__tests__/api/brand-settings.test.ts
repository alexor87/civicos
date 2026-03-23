import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const { mockGetUser, mockFrom, mockUpsert } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockUpsert  = vi.fn().mockResolvedValue({ error: null })
  const mockFrom    = vi.fn()
  return { mockGetUser, mockFrom, mockUpsert }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { PATCH } from '@/app/api/settings/brand/route'

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/settings/brand', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

const TENANT_ID = 'tenant-001'

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('PATCH /api/settings/brand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { tenant_id: TENANT_ID, role: 'super_admin' },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === 'tenant_branding') {
        return { upsert: mockUpsert }
      }
      return {}
    })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await PATCH(makeRequest({ color_primary: '#dc2626' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 when role is volunteer', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { tenant_id: TENANT_ID, role: 'volunteer' },
                error: null,
              }),
            }),
          }),
        }
      }
      return { upsert: mockUpsert }
    })
    const res = await PATCH(makeRequest({ color_primary: '#dc2626' }))
    expect(res.status).toBe(403)
  })

  it('upserts color_primary', async () => {
    await PATCH(makeRequest({ color_primary: '#dc2626' }))
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: TENANT_ID, color_primary: '#dc2626' }),
      expect.objectContaining({ onConflict: 'tenant_id' })
    )
  })

  it('upserts slogan', async () => {
    await PATCH(makeRequest({ slogan: 'Juntos construimos' }))
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ slogan: 'Juntos construimos' }),
      expect.anything()
    )
  })

  it('upserts candidate_name and candidate_role', async () => {
    await PATCH(makeRequest({
      candidate_name: 'María López',
      candidate_role: 'Candidata a la alcaldía',
    }))
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        candidate_name: 'María López',
        candidate_role: 'Candidata a la alcaldía',
      }),
      expect.anything()
    )
  })

  it('returns 200 with success on valid update', async () => {
    const res = await PATCH(makeRequest({ color_primary: '#7c3aed', slogan: 'Test' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 500 when upsert fails', async () => {
    mockUpsert.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const res = await PATCH(makeRequest({ color_primary: '#dc2626' }))
    expect(res.status).toBe(500)
  })
})
