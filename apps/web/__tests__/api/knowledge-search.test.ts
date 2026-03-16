import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockRpc,
  mockOpenAIEmbeddings,
} = vi.hoisted(() => ({
  mockGetUser:          vi.fn(),
  mockProfileSingle:    vi.fn(),
  mockRpc:              vi.fn(),
  mockOpenAIEmbeddings: vi.fn().mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.1) }],
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ single: mockProfileSingle })),
          })),
        }
      }
      return {}
    }),
    rpc: mockRpc,
  })),
}))

vi.mock('openai', () => ({
  default: class MockOpenAI {
    embeddings = { create: mockOpenAIEmbeddings }
  },
}))

import { POST } from '@/app/api/knowledge/search/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/knowledge/search', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockOpenAIEmbeddings.mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.1) }],
  })
})

describe('POST /api/knowledge/search', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(makeRequest({ query: 'propuestas', campaign_id: 'c1' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when query is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1' } })
    const res = await POST(makeRequest({ campaign_id: 'c1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when campaign_id is missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1' } })
    const res = await POST(makeRequest({ query: 'propuestas' }))
    expect(res.status).toBe(400)
  })

  it('returns search results from Supabase RPC', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1' } })
    mockRpc.mockResolvedValueOnce({
      data: [
        { id: 'doc1', title: 'Propuestas de seguridad', content: 'El candidato propone...', similarity: 0.85 },
        { id: 'doc2', title: 'Plan económico', content: 'En materia económica...', similarity: 0.72 },
      ],
      error: null,
    })

    const res  = await POST(makeRequest({ query: 'propuestas', campaign_id: 'c1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0]).toMatchObject({ title: 'Propuestas de seguridad', similarity: 0.85 })
  })

  it('returns empty array when no documents match', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1' } })
    mockRpc.mockResolvedValueOnce({ data: [], error: null })

    const res  = await POST(makeRequest({ query: 'algo muy específico', campaign_id: 'c1' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(0)
  })
})
