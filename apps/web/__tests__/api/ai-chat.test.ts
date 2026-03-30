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
  mockCallAI,
} = vi.hoisted(() => ({
  mockGetUser:          vi.fn(),
  mockProfileSelect:    vi.fn(),
  mockCampaignSelect:   vi.fn(),
  mockSuggestionsSelect: vi.fn(),
  mockAgentRunsSelect:  vi.fn(),
  mockContactsCount:    vi.fn(),
  mockSupportersCount:  vi.fn(),
  mockVisitsCount:      vi.fn(),
  mockCallAI:           vi.fn(),
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

vi.mock('@/lib/ai/call-ai', () => ({
  callAI: mockCallAI,
  AiNotConfiguredError: class extends Error { constructor(msg: string) { super(msg); this.name = 'AiNotConfiguredError' } },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({})),
}))

import { POST } from '@/app/api/ai/chat/route'

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
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
    mockProfileSelect.mockResolvedValue({ data: { role: 'campaign_manager', campaign_ids: ['camp1'], tenant_id: 'tenant-1' } })
  })

  it('returns Response with text/plain content-type', async () => {
    mockDefaults()
    mockCallAI.mockResolvedValue({ content: 'Hola campaña' })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
  })

  it('returns the text from callAI', async () => {
    mockDefaults()
    mockCallAI.mockResolvedValue({ content: 'Todo bien' })
    const res = await POST(makeRequest(VALID_BODY))
    const text = await readStream(res)
    expect(text).toBe('Todo bien')
  })

  it('system prompt includes campaign name', async () => {
    mockDefaults()
    mockCallAI.mockResolvedValue({ content: 'ok' })
    await POST(makeRequest(VALID_BODY))
    const callArgs = mockCallAI.mock.calls[0]
    // callAI(supabase, tenantId, campaignId, messages, { system, maxTokens })
    const options = callArgs[4]
    expect(options.system).toContain('Prueba')
  })

  it('sends full conversation history to callAI', async () => {
    mockDefaults()
    mockCallAI.mockResolvedValue({ content: 'ok' })
    const messages = [
      { role: 'user', content: 'Primera pregunta' },
      { role: 'assistant', content: 'Primera respuesta' },
      { role: 'user', content: 'Segunda pregunta' },
    ]
    await POST(makeRequest({ campaign_id: 'camp1', messages }))
    const callArgs = mockCallAI.mock.calls[0]
    // callAI(supabase, tenantId, campaignId, messages, options)
    expect(callArgs[3]).toHaveLength(3)
  })

  it('system prompt includes recent suggestions when present', async () => {
    mockCampaignSelect.mockResolvedValue({ data: { name: 'Prueba', election_date: '2026-10-25' } })
    mockSuggestionsSelect.mockResolvedValue({ data: [{ priority: 'high', title: 'Alerta visitas', description: 'Caída detectada' }] })
    mockAgentRunsSelect.mockResolvedValue({ data: [] })
    mockContactsCount.mockResolvedValue({ count: 50 })
    mockSupportersCount.mockResolvedValue({ count: 20 })
    mockVisitsCount.mockResolvedValue({ count: 3 })
    mockCallAI.mockResolvedValue({ content: 'ok' })
    await POST(makeRequest(VALID_BODY))
    const callArgs = mockCallAI.mock.calls[0]
    const options = callArgs[4]
    expect(options.system).toContain('Alerta visitas')
  })
})

describe('POST /api/ai/chat — errors', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'super_admin', campaign_ids: [], tenant_id: 'tenant-1' } })
  })

  it('returns 400 when messages missing', async () => {
    const res = await POST(makeRequest({ campaign_id: 'camp1' }))
    expect(res.status).toBe(400)
  })

  it('returns 500 when callAI throws', async () => {
    mockDefaults()
    mockCallAI.mockRejectedValue(new Error('API down'))
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
  })
})
