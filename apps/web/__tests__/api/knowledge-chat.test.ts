import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockRpc,
  mockOpenAIEmbeddings,
  mockAnthropicStream,
} = vi.hoisted(() => ({
  mockGetUser:          vi.fn(),
  mockProfileSingle:    vi.fn(),
  mockRpc:              vi.fn(),
  mockOpenAIEmbeddings: vi.fn().mockResolvedValue({
    data: [{ embedding: new Array(1536).fill(0.1) }],
  }),
  mockAnthropicStream: vi.fn(),
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

// Mock Anthropic stream
const mockAsyncIterator = (chunks: string[]) => ({
  [Symbol.asyncIterator]: async function* () {
    for (const text of chunks) {
      yield {
        type:  'content_block_delta',
        delta: { type: 'text_delta', text },
      }
    }
  },
})

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { stream: mockAnthropicStream }
  },
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
    expect(mockAnthropicStream).not.toHaveBeenCalled()
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
    mockAnthropicStream.mockReturnValueOnce(
      mockAsyncIterator(['Las propuestas del candidato son: ', 'mejorar la seguridad.'])
    )

    const res  = await POST(makeRequest({ messages: validMessages, campaign_id: 'c1' }))
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(text).toContain('Las propuestas del candidato son: ')
    expect(mockAnthropicStream).toHaveBeenCalledTimes(1)
    // Verify system prompt includes document content
    const callArgs = mockAnthropicStream.mock.calls[0][0]
    expect(callArgs.system).toContain('mejorar la seguridad')
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
    mockAnthropicStream.mockReturnValueOnce(mockAsyncIterator(['OK']))

    await POST(makeRequest({ messages: validMessages, campaign_id: 'c1' }))

    const callArgs = mockAnthropicStream.mock.calls[0][0]
    expect(callArgs.system).toContain('Contenido A')
    expect(callArgs.system).toContain('Contenido B')
  })
})
