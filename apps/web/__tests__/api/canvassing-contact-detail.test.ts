import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/canvassing/contacts/[id]/route'
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
    ? `http://localhost/api/canvassing/contacts/${contactId}?campaignId=${campaignId}`
    : `http://localhost/api/canvassing/contacts/${contactId}`
  return [new NextRequest(url), { params: Promise.resolve({ id: contactId }) }]
}

describe('GET /api/canvassing/contacts/:id', () => {
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

  it('returns 404 if contact not found', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.is = vi.fn().mockReturnValue(chain)
    chain.single = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
    mockSupabase.from.mockReturnValue(chain)

    const [req, ctx] = makeRequest('c1', 'camp1')
    const res = await GET(req, ctx)
    expect(res.status).toBe(404)
  })

  it('returns contact with lastVisit when visit exists', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const contactData = {
      id: 'c1', first_name: 'Juan', last_name: 'García',
      email: 'juan@test.com', phone: '3001234567',
      address: 'Calle 10', city: 'Medellín',
      status: 'supporter', tags: ['vip'],
      document_number: 'CC123', department: 'Antioquia', municipality: 'Medellín',
    }
    const visitData = {
      id: 'v1', result: 'positive', notes: 'Good',
      created_at: '2026-01-01', sympathy_level: 4, vote_intention: 'will_vote_us',
    }

    // First call: contacts query
    const contactChain: Record<string, unknown> = {}
    contactChain.select = vi.fn().mockReturnValue(contactChain)
    contactChain.eq = vi.fn().mockReturnValue(contactChain)
    contactChain.is = vi.fn().mockReturnValue(contactChain)
    contactChain.single = vi.fn().mockResolvedValue({ data: contactData, error: null })

    // Second call: visits query
    const visitChain: Record<string, unknown> = {}
    visitChain.select = vi.fn().mockReturnValue(visitChain)
    visitChain.eq = vi.fn().mockReturnValue(visitChain)
    visitChain.order = vi.fn().mockReturnValue(visitChain)
    visitChain.limit = vi.fn().mockReturnValue(visitChain)
    visitChain.maybeSingle = vi.fn().mockResolvedValue({ data: visitData, error: null })

    mockSupabase.from
      .mockReturnValueOnce(contactChain)
      .mockReturnValueOnce(visitChain)

    const [req, ctx] = makeRequest('c1', 'camp1')
    const res = await GET(req, ctx)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.contact.first_name).toBe('Juan')
    expect(json.lastVisit.result).toBe('positive')
  })

  it('returns contact with null lastVisit when no visits exist', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

    const contactData = {
      id: 'c1', first_name: 'María', last_name: 'López',
      email: null, phone: '3009999999',
      address: null, city: null,
      status: 'unknown', tags: [],
      document_number: 'CC456', department: null, municipality: null,
    }

    const contactChain: Record<string, unknown> = {}
    contactChain.select = vi.fn().mockReturnValue(contactChain)
    contactChain.eq = vi.fn().mockReturnValue(contactChain)
    contactChain.is = vi.fn().mockReturnValue(contactChain)
    contactChain.single = vi.fn().mockResolvedValue({ data: contactData, error: null })

    const visitChain: Record<string, unknown> = {}
    visitChain.select = vi.fn().mockReturnValue(visitChain)
    visitChain.eq = vi.fn().mockReturnValue(visitChain)
    visitChain.order = vi.fn().mockReturnValue(visitChain)
    visitChain.limit = vi.fn().mockReturnValue(visitChain)
    visitChain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

    mockSupabase.from
      .mockReturnValueOnce(contactChain)
      .mockReturnValueOnce(visitChain)

    const [req, ctx] = makeRequest('c1', 'camp1')
    const res = await GET(req, ctx)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.contact.first_name).toBe('María')
    expect(json.lastVisit).toBeNull()
  })
})
