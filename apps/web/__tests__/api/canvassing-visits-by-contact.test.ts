import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/canvassing/visits/by-contact/[id]/route'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  ;(createClient as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase)
})

function makeRequest(contactId: string, campaignId?: string): [NextRequest, { params: Promise<{ id: string }> }] {
  const url = campaignId
    ? `http://localhost/api/canvassing/visits/by-contact/${contactId}?campaignId=${campaignId}`
    : `http://localhost/api/canvassing/visits/by-contact/${contactId}`
  return [new NextRequest(url), { params: Promise.resolve({ id: contactId }) }]
}

describe('GET /api/canvassing/visits/by-contact/:id', () => {
  it('returns 400 if campaignId is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const [req, ctx] = makeRequest('c1')
    const res = await GET(req, ctx)
    expect(res.status).toBe(400)
  })

  it('returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    const [req, ctx] = makeRequest('c1', 'camp1')
    const res = await GET(req, ctx)
    expect(res.status).toBe(401)
  })

  it('returns 404 if contact has no visits', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.limit = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockSupabase.from.mockReturnValue(chain)

    const [req, ctx] = makeRequest('c1', 'camp1')
    const res = await GET(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns visit data when found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const visitData = {
      id: 'v1',
      result: 'positive',
      notes: 'Great chat',
      contacts: { first_name: 'Juan', last_name: 'García' },
      profiles: { full_name: 'Volunteer 1' },
      territories: null,
    }
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)
    chain.limit = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: visitData, error: null })
    mockSupabase.from.mockReturnValue(chain)

    const [req, ctx] = makeRequest('c1', 'camp1')
    const res = await GET(req, ctx)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.result).toBe('positive')
    expect(json.contacts.first_name).toBe('Juan')
  })
})
