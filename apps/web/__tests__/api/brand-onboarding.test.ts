import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ──────────────────────────────────────────────────────────────

const { mockGetUser, mockFrom, mockUpsert, mockEq } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockEq      = vi.fn().mockResolvedValue({ error: null })
  const mockUpsert  = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom    = vi.fn()
  return { mockGetUser, mockFrom, mockUpsert, mockEq }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { POST } from '@/app/api/brand/onboarding/route'

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/brand/onboarding', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

const TENANT_ID = 'tenant-001'

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('POST /api/brand/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { tenant_id: TENANT_ID },
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
    const res = await POST(makeRequest({ color_primary: '#dc2626' }))
    expect(res.status).toBe(401)
  })

  it('upserts tenant_branding with provided colors', async () => {
    await POST(makeRequest({
      color_primary:    '#dc2626',
      color_secondary:  '#1e293b',
      color_accent:     '#ea580c',
      color_background: '#f8fafc',
      color_surface:    '#ffffff',
    }))

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id:        TENANT_ID,
        color_primary:    '#dc2626',
        color_secondary:  '#1e293b',
        onboarding_completed: true,
      }),
      expect.objectContaining({ onConflict: 'tenant_id' })
    )
  })

  it('saves slogan and candidate info', async () => {
    await POST(makeRequest({
      slogan:         'Juntos construimos el futuro',
      candidate_name: 'María López',
      candidate_role: 'Candidata a la alcaldía',
    }))

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        slogan:         'Juntos construimos el futuro',
        candidate_name: 'María López',
        candidate_role: 'Candidata a la alcaldía',
      }),
      expect.anything()
    )
  })

  it('saves logo_url and candidate_photo_url', async () => {
    await POST(makeRequest({
      logo_url:           'https://cdn.example.com/logo.png',
      candidate_photo_url: 'https://cdn.example.com/photo.jpg',
    }))

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        logo_url:           'https://cdn.example.com/logo.png',
        candidate_photo_url: 'https://cdn.example.com/photo.jpg',
      }),
      expect.anything()
    )
  })

  it('returns 200 with success on completion', async () => {
    const res = await POST(makeRequest({
      color_primary: '#2960ec',
      slogan:        'Test slogan',
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 500 when upsert fails', async () => {
    mockUpsert.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    })
    const res = await POST(makeRequest({ color_primary: '#dc2626' }))
    expect(res.status).toBe(500)
  })
})
