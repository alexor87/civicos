import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSelect,
  mockCampaignsSelect,
  mockEmailCampaigns,
  mockSmsCampaigns,
  mockInactiveContacts,
  mockDraftEmail,
  mockDraftSms,
  mockAgentRunInsert,
  mockAgentRunUpdate,
  mockSuggestionsSelect,
  mockSuggestionsInsert,
  mockAnthropicCreate,
} = vi.hoisted(() => ({
  mockGetUser:           vi.fn(),
  mockProfileSelect:     vi.fn(),
  mockCampaignsSelect:   vi.fn(),
  mockEmailCampaigns:    vi.fn(),
  mockSmsCampaigns:      vi.fn(),
  mockInactiveContacts:  vi.fn(),
  mockDraftEmail:        vi.fn(),
  mockDraftSms:          vi.fn(),
  mockAgentRunInsert:    vi.fn(),
  mockAgentRunUpdate:    vi.fn(),
  mockSuggestionsSelect: vi.fn(),
  mockSuggestionsInsert: vi.fn(),
  mockAnthropicCreate:   vi.fn(),
}))

function makeChain(terminalFn: ReturnType<typeof vi.fn>) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'lte', 'gte', 'in', 'order', 'limit', 'lt', 'not', 'single', 'select', 'range']
  for (const m of methods) { chain[m] = vi.fn(() => chain) }
  chain.then = vi.fn((resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    terminalFn().then(resolve, reject)
  )
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    let emailCampaignCount = 0
    let smsCampaignCount   = 0
    let contactsCount      = 0

    return {
      auth: { getUser: mockGetUser },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSelect })) })) }
        }
        if (table === 'campaigns') {
          return { select: vi.fn(() => ({ eq: vi.fn(mockCampaignsSelect) })) }
        }
        if (table === 'email_campaigns') {
          emailCampaignCount++
          const fn = emailCampaignCount === 2 ? mockDraftEmail : mockEmailCampaigns
          return { select: vi.fn(() => makeChain(fn)) }
        }
        if (table === 'sms_campaigns') {
          smsCampaignCount++
          const fn = smsCampaignCount === 2 ? mockDraftSms : mockSmsCampaigns
          return { select: vi.fn(() => makeChain(fn)) }
        }
        if (table === 'contacts') {
          contactsCount++
          return { select: vi.fn(() => makeChain(mockInactiveContacts)) }
        }
        if (table === 'agent_runs') {
          return {
            insert: vi.fn(() => ({ select: vi.fn(() => ({ single: mockAgentRunInsert })) })),
            update: vi.fn(() => ({ eq: mockAgentRunUpdate })),
          }
        }
        if (table === 'ai_suggestions') {
          return {
            select: vi.fn(() => makeChain(mockSuggestionsSelect)),
            insert: vi.fn(mockSuggestionsInsert),
          }
        }
        return {}
      }),
    }
  }),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockAnthropicCreate }
  },
}))

import { POST } from '@/app/api/agents/smart-comms/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(opts: { secret?: string; withAuth?: boolean } = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.secret !== undefined) headers['x-cron-secret'] = opts.secret
  return new NextRequest('http://localhost/api/agents/smart-comms', {
    method: 'POST', headers, body: JSON.stringify({}),
  })
}

const CAMPAIGN = { id: 'camp1', tenant_id: 't1', name: 'Prueba', is_active: true }

const CLAUDE_SUGGESTION = [{
  type: 'reactivate_inactive', module: 'comunicaciones', priority: 'high',
  title: 'Reactivar 30 contactos', description: '30 contactos sin interacción 30d',
  reasoning: 'Mejorar engagement', estimated_impact: '+20%', action_payload: {},
}]

function mockDefaults() {
  mockEmailCampaigns.mockResolvedValue({ data: [] })
  mockSmsCampaigns.mockResolvedValue({ data: [] })
  mockInactiveContacts.mockResolvedValue({ count: 0 })
  mockDraftEmail.mockResolvedValue({ data: [] })
  mockDraftSms.mockResolvedValue({ data: [] })
  mockAgentRunInsert.mockResolvedValue({ data: { id: 'run1' } })
  mockAgentRunUpdate.mockResolvedValue({})
  mockSuggestionsSelect.mockResolvedValue({ data: [] })
  mockSuggestionsInsert.mockResolvedValue({ error: null })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET       = 'secret123'
  process.env.ANTHROPIC_API_KEY = 'test-key'
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockProfileSelect.mockResolvedValue({ data: null })
})

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('POST /api/agents/smart-comms — auth', () => {
  it('returns 401 with wrong cron secret', async () => {
    const res = await POST(makeRequest({ secret: 'wrong' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when unauthenticated user (no secret, no session)', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('accepts valid cron secret', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res = await POST(makeRequest({ secret: 'secret123' }))
    expect(res.status).toBe(200)
  })

  it('accepts authenticated campaign_manager without cron secret', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { tenant_id: 't1', campaign_ids: ['camp1'], role: 'campaign_manager' } })
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
  })

  it('rejects field_coordinator (insufficient role) without cron secret', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'field_coordinator' } })
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })
})

// ── No campaigns ──────────────────────────────────────────────────────────────

describe('POST /api/agents/smart-comms — no campaigns', () => {
  it('returns 0 suggestions when no active campaigns', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res  = await POST(makeRequest({ secret: 'secret123' }))
    const body = await res.json()
    expect(body).toEqual({ processed: 0, suggestions_created: 0 })
  })
})

// ── Happy path ────────────────────────────────────────────────────────────────

describe('POST /api/agents/smart-comms — happy path', () => {
  it('calls Claude and inserts suggestion', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(CLAUDE_SUGGESTION) }],
    })

    const res  = await POST(makeRequest({ secret: 'secret123' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.processed).toBe(1)
    expect(body.suggestions_created).toBe(1)
    expect(mockAnthropicCreate).toHaveBeenCalledTimes(1)
    expect(mockSuggestionsInsert).toHaveBeenCalledTimes(1)
  })
})

// ── Deduplication ─────────────────────────────────────────────────────────────

describe('POST /api/agents/smart-comms — deduplication', () => {
  it('skips inserting when suggestion type already active', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockSuggestionsSelect.mockResolvedValue({ data: [{ type: 'reactivate_inactive' }] })
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify(CLAUDE_SUGGESTION) }],
    })

    const res  = await POST(makeRequest({ secret: 'secret123' }))
    const body = await res.json()

    expect(body.suggestions_created).toBe(0)
    expect(mockSuggestionsInsert).not.toHaveBeenCalled()
  })
})

// ── Resilience ────────────────────────────────────────────────────────────────

describe('POST /api/agents/smart-comms — resilience', () => {
  it('handles malformed Claude JSON gracefully', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockAnthropicCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Not JSON at all' }],
    })

    const res  = await POST(makeRequest({ secret: 'secret123' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.suggestions_created).toBe(0)
  })
})
