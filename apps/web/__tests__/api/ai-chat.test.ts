import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetUser,
  mockProfileSelect,
  mockCampaignSelect,
  mockSuggestionsSelect,
  mockAgentRunsSelect,
  mockContactsCount,
  mockSupportersCount,
  mockVisitsCount,
  mockAnthropicStream,
} = vi.hoisted(() => ({
  mockGetUser:          vi.fn(),
  mockProfileSelect:    vi.fn(),
  mockCampaignSelect:   vi.fn(),
  mockSuggestionsSelect: vi.fn(),
  mockAgentRunsSelect:  vi.fn(),
  mockContactsCount:    vi.fn(),
  mockSupportersCount:  vi.fn(),
  mockVisitsCount:      vi.fn(),
  mockAnthropicStream:  vi.fn(),
}))

function makeChain(terminalFn: ReturnType<typeof vi.fn>) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'in', 'order', 'limit', 'gte', 'single', 'select']
  for (const m of methods) { chain[m] = vi.fn(() => chain) }
  chain.then = vi.fn((resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    terminalFn().then(resolve, reject)
  )
  return chain
}

let contactsCallCount = 0

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSelect })) })) }
      }
      if (table === 'campaigns') {
        return { select: vi.fn(() => makeChain(mockCampaignSelect)) }
      }
      if (table === 'ai_suggestions') {
        return { select: vi.fn(() => makeChain(mockSuggestionsSelect)) }
      }
      if (table === 'agent_runs') {
        return { select: vi.fn(() => makeChain(mockAgentRunsSelect)) }
      }
      if (table === 'contacts') {
        contactsCallCount++
        const fn = contactsCallCount % 2 === 1 ? mockContactsCount : mockSupportersCount
        return { select: vi.fn(() => makeChain(fn)) }
      }
      if (table === 'canvass_visits') {
        return { select: vi.fn(() => makeChain(mockVisitsCount)) }
      }
      return {}
    }),
  })),
}))

// Mock Anthropic streaming
vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      stream: mockAnthropicStream,
    }
  },
}))

import { POST } from '@/app/api/ai/chat/route'

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeAsyncIterable(texts: string[]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const text of texts) {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text } }
      }
    },
  }
}

const VALID_BODY = {
  campaign_id: 'camp1',
  messages: [{ role: 'user', content: '¿Cómo va la campaña?' }],
}

function mockDefaults() {
  mockCampaignSelect.mockResolvedValue({ data: { name: 'Prueba', election_date: '2026-10-25' } })
  mockSuggestionsSelect.mockResolvedValue({ data: [] })
  mockAgentRunsSelect.mockResolvedValue({ data: [] })
  mockContactsCount.mockResolvedValue({ count: 100 })
  mockSupportersCount.mockResolvedValue({ count: 40 })
  mockVisitsCount.mockResolvedValue({ count: 5 })
}

beforeEach(() => {
  vi.clearAllMocks()
  contactsCallCount = 0
  process.env.ANTHROPIC_API_KEY = 'test-key'
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockProfileSelect.mockResolvedValue({ data: null })
})

async function readStream(res: Response): Promise<string> {
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    result += decoder.decode(value, { stream: true })
  }
  return result
}

describe('POST /api/ai/chat — auth', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 403 when campaign_id not in user campaign_ids', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'campaign_manager', campaign_ids: ['other'] } })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(403)
  })
})

describe('POST /api/ai/chat — happy path', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'campaign_manager', campaign_ids: ['camp1'] } })
  })

  it('returns streaming Response with text/plain content-type', async () => {
    mockDefaults()
    mockAnthropicStream.mockReturnValue(makeAsyncIterable(['Hola', ' campaña']))
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
  })

  it('streams the text from Anthropic', async () => {
    mockDefaults()
    mockAnthropicStream.mockReturnValue(makeAsyncIterable(['Todo ', 'bien']))
    const res = await POST(makeRequest(VALID_BODY))
    const text = await readStream(res)
    expect(text).toBe('Todo bien')
  })

  it('system prompt includes campaign name', async () => {
    mockDefaults()
    mockAnthropicStream.mockReturnValue(makeAsyncIterable(['ok']))
    await POST(makeRequest(VALID_BODY))
    const callArgs = mockAnthropicStream.mock.calls[0][0]
    expect(callArgs.system).toContain('Prueba')
  })

  it('sends full conversation history to Anthropic', async () => {
    mockDefaults()
    mockAnthropicStream.mockReturnValue(makeAsyncIterable(['ok']))
    const messages = [
      { role: 'user', content: 'Primera pregunta' },
      { role: 'assistant', content: 'Primera respuesta' },
      { role: 'user', content: 'Segunda pregunta' },
    ]
    await POST(makeRequest({ campaign_id: 'camp1', messages }))
    const callArgs = mockAnthropicStream.mock.calls[0][0]
    expect(callArgs.messages).toHaveLength(3)
  })

  it('system prompt includes recent suggestions when present', async () => {
    mockCampaignSelect.mockResolvedValue({ data: { name: 'Prueba', election_date: '2026-10-25' } })
    mockSuggestionsSelect.mockResolvedValue({ data: [{ priority: 'high', title: 'Alerta visitas', description: 'Caída detectada' }] })
    mockAgentRunsSelect.mockResolvedValue({ data: [] })
    mockContactsCount.mockResolvedValue({ count: 50 })
    mockSupportersCount.mockResolvedValue({ count: 20 })
    mockVisitsCount.mockResolvedValue({ count: 3 })
    mockAnthropicStream.mockReturnValue(makeAsyncIterable(['ok']))
    await POST(makeRequest(VALID_BODY))
    const callArgs = mockAnthropicStream.mock.calls[0][0]
    expect(callArgs.system).toContain('Alerta visitas')
  })
})

describe('POST /api/ai/chat — errors', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'super_admin', campaign_ids: [] } })
  })

  it('returns 400 when messages missing', async () => {
    const res = await POST(makeRequest({ campaign_id: 'camp1' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when Anthropic throws', async () => {
    mockDefaults()
    mockAnthropicStream.mockImplementation(() => { throw new Error('API down') })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
  })
})
