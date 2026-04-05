import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Mock supabase ────────────────────────────────────────────────────────
const mockGetUser = vi.fn()
const mockSingle = vi.fn()
const mockRpc = vi.fn()

const mockFrom = vi.fn(() => ({
  select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSingle })) })),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
  createAdminClient: vi.fn(async () => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

import { POST } from '@/app/api/onboarding/activate/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/onboarding/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  electionType: 'alcalde',
  candidateName: 'María García',
  plan: 'profesional',
  electionDate: '2026-10-25',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/onboarding/activate', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValueOnce({ data: { tenant_id: 'tenant-1' } })

    const res = await POST(makeRequest({ electionType: 'alcalde' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/candidato/i)
  })

  it('returns 200 and calls request_campaign_activation RPC on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValueOnce({ data: { tenant_id: 'tenant-1' } })
    mockRpc.mockResolvedValueOnce({ data: null, error: null })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.status).toBe('pending_approval')

    expect(mockRpc).toHaveBeenCalledWith(
      'request_campaign_activation',
      expect.objectContaining({
        p_tenant_id: 'tenant-1',
        p_wizard_data: expect.objectContaining({
          electionType: 'alcalde',
          candidateName: 'María García',
        }),
      })
    )
  })

  it('returns 500 when RPC fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockSingle.mockResolvedValueOnce({ data: { tenant_id: 'tenant-1' } })
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC failed' } })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/solicitud/i)
  })
})
