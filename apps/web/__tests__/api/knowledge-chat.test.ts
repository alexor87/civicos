import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockRpc,
  mockOpenAIEmbeddings,
  mockCallAI,
} = vi.hoisted(() => ({
  mockGetUser:          vi.fn(),
  mockProfileSingle:    vi.fn(),
  mockRpc:              vi.fn(),
  mockOpenAIEmbeddings: vi.fn().mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.1) }],
  }),
  mockCallAI:          vi.fn(),
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

vi.mock('@/lib/ai/call-ai', () => ({
  callAI: mockCallAI,
  AiNotConfiguredError: class extends Error { constructor(msg: string) { super(msg); this.name = 'AiNotConfiguredError' } },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({})),
}))

import { POST } from '@/app/api/knowledge/chat/route'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/knowledge/chat', {
    method:  'POST',
    body:    JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const validMessages = [{ role: 'user', content: '¿Cuáles son las propuestas del candidato?' }]

beforeEach(() => {
  vi.clearAllMocks()
  mockOpenAIEmbeddings.mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.1) }],
  })
})

describe('POST /api/knowledge/chat', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const res = await POST(makeRequest({ messages: validMessages, campaign_id: 'c1' }))
    expect(res.status).toBe(401)
  })

  it('returns fallback message when no relevant documents found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', campaign_ids: ['c1'] } })
    mockRpc.mockResolvedValueOnce({ data: [], error: null })

    const res  = await POST(makeRequest({ messages: validMessages, campaign_id: 'c1' }))
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(text).toContain('No tengo información')
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('streams Claude response with document context when chunks found', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', campaign_ids: ['c1'] } })
    mockRpc.mockResolvedValueOnce({
      data: [
        { id: 'doc1', title: 'Propuestas', content: 'El candidato propone mejorar la seguridad.', similarity: 0.88 },
      ],
      error: null,
    })
    mockCallAI.mockResolvedValueOnce({
      content: 'Las propuestas del candidato son: mejorar la seguridad.',
    })

    const res  = await POST(makeRequest({ messages: validMessages, campaign_id: 'c1' }))
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(text).toContain('Las propuestas del candidato son: ')
    expect(mockCallAI).toHaveBeenCalledTimes(1)
    // Verify system prompt includes document content
    const callArgs = mockCallAI.mock.calls[0]
    const options = callArgs[4]
    expect(options.system).toContain('mejorar la seguridad')
  })

  it('includes all chunks in system prompt', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({ data: { tenant_id: 't1', campaign_ids: ['c1'] } })
    mockRpc.mockResolvedValueOnce({
      data: [
        { id: 'd1', title: 'Doc A', content: 'Contenido A', similarity: 0.9 },
        { id: 'd2', title: 'Doc B', content: 'Contenido B', similarity: 0.8 },
      ],
      error: null,
    })
    mockCallAI.mockResolvedValueOnce({ content: 'OK' })

    await POST(makeRequest({ messages: validMessages, campaign_id: 'c1' }))

    const callArgs = mockCallAI.mock.calls[0]
    const options = callArgs[4]
    expect(options.system).toContain('Contenido A')
    expect(options.system).toContain('Contenido B')
  })
})
