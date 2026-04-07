import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSelect,
  mockCampaignsSelect,
  mockTerritoriesSelect,
  mockVisitCount,
  mockContactCount,
  mockRecentVisits,
  mockVolProfiles,
  mockAgentRunInsert,
  mockAgentRunUpdate,
  mockSuggestionsSelect,
  mockSuggestionsInsert,
  mockCallAI,
} = vi.hoisted(() => ({
  mockGetUser:           vi.fn(),
  mockProfileSelect:     vi.fn(),
  mockCampaignsSelect:   vi.fn(),
  mockTerritoriesSelect: vi.fn(),
  mockVisitCount:        vi.fn(),
  mockContactCount:      vi.fn(),
  mockRecentVisits:      vi.fn(),
  mockVolProfiles:       vi.fn(),
  mockAgentRunInsert:    vi.fn(),
  mockAgentRunUpdate:    vi.fn(),
  mockSuggestionsSelect: vi.fn(),
  mockSuggestionsInsert: vi.fn(),
  mockCallAI:            vi.fn(),
}))

function makeChain(terminalFn: ReturnType<typeof vi.fn>) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'lte', 'gte', 'in', 'order', 'limit', 'lt', 'not', 'single', 'is', 'range']
  for (const m of methods) { chain[m] = vi.fn(() => chain) }
  chain.then = vi.fn((resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    terminalFn().then(resolve, reject)
  )
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    let canvassCallCount = 0
    let contactCallCount = 0

    return {
      auth: { getUser: mockGetUser },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({ single: mockProfileSelect })),
              in: vi.fn(mockVolProfiles),
            })),
          }
        }
        if (table === 'campaigns') {
          return { select: vi.fn(() => ({ eq: vi.fn(mockCampaignsSelect) })) }
        }
        if (table === 'territories') {
          return { select: vi.fn(() => makeChain(mockTerritoriesSelect)) }
        }
        if (table === 'canvass_visits') {
          canvassCallCount++
          // First N calls per territory → visit count; then recent visits query
          // We simplify: odd call = visit count, last call = recent visits
          const fn = canvassCallCount % 2 === 1 ? mockVisitCount : mockRecentVisits
          return { select: vi.fn(() => makeChain(fn)) }
        }
        if (table === 'contacts') {
          contactCallCount++
          return { select: vi.fn(() => makeChain(mockContactCount)) }
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

vi.mock('@/lib/ai/call-ai', () => ({
  callAI: mockCallAI,
  AiNotConfiguredError: class extends Error { constructor(msg: string) { super(msg); this.name = 'AiNotConfiguredError' } },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return { select: vi.fn(() => ({ eq: vi.fn(mockCampaignsSelect) })) }
      }
      return {}
    }),
  })),
}))

import { POST } from '@/app/api/agents/territory-redistribution/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(secret?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['x-cron-secret'] = secret
  return new NextRequest('http://localhost/api/agents/territory-redistribution', {
    method: 'POST', headers, body: JSON.stringify({}),
  })
}

const CAMPAIGN = { id: 'camp1', tenant_id: 't1', name: 'Prueba', is_active: true, election_date: null }

const CLAUDE_PROPOSAL = {
  title: 'Redistribuir voluntarios Norte → Sur',
  description: 'Sur tiene cobertura 20%, Norte tiene 80%.',
  reasoning: 'Maximizar cobertura total',
  estimated_impact: '+25% cobertura en Sur',
  redistribution_plan: [{ from_territory: 'Norte', to_territory: 'Sur', volunteers: 3, reason: 'Baja cobertura' }],
  priority: 'high',
}

function mockDefaults() {
  mockAgentRunInsert.mockResolvedValue({ data: { id: 'run1' } })
  mockAgentRunUpdate.mockResolvedValue({})
  mockSuggestionsSelect.mockResolvedValue({ data: [] })
  mockSuggestionsInsert.mockResolvedValue({ error: null })
  mockRecentVisits.mockResolvedValue({ data: [] })
  mockVolProfiles.mockResolvedValue({ data: [] })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET       = 'secret123'
  process.env.ANTHROPIC_API_KEY = 'test-key'
  mockGetUser.mockResolvedValue({ data: { user: null } })
  mockProfileSelect.mockResolvedValue({ data: null })
})

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('POST /api/agents/territory-redistribution — auth', () => {
  it('returns 401 with wrong cron secret', async () => {
    const res = await POST(makeRequest('wrong'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when no session and no cron secret', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('accepts valid cron secret', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res = await POST(makeRequest('secret123'))
    expect(res.status).toBe(200)
  })

  it('accepts authenticated field_coordinator without cron secret', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'field_coordinator' } })
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
  })
})

// ── Coverage adequate ─────────────────────────────────────────────────────────

describe('POST /api/agents/territory-redistribution — coverage adequate', () => {
  it('skips proposal when all territories have ≥40% coverage', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    // Territory with high coverage (80 visits / 100 contacts = 80%)
    mockTerritoriesSelect.mockResolvedValue({ data: [{ id: 't1', name: 'Norte', priority: 'high' }] })
    mockVisitCount.mockResolvedValue({ data: Array.from({ length: 80 }, () => ({ territory_id: 't1' })) })
    mockContactCount.mockResolvedValue({ data: Array.from({ length: 100 }, () => ({ district: 'Norte' })) })

    const res  = await POST(makeRequest('secret123'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.proposals_created).toBe(0)
    expect(mockCallAI).not.toHaveBeenCalled()
  })
})

// ── Low coverage triggers proposal ────────────────────────────────────────────

describe('POST /api/agents/territory-redistribution — low coverage', () => {
  it('creates pending_approval proposal when coverage < 40%', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockTerritoriesSelect.mockResolvedValue({ data: [
      { id: 't1', name: 'Sur', priority: 'high' },
      { id: 't2', name: 'Norte', priority: 'normal' },
    ] })
    // Sur: 10/100 = 10% (low); Norte: 90/100 = 90% (high) — bulk queries return all rows
    mockVisitCount.mockResolvedValueOnce({ data: [
      ...Array.from({ length: 10 }, () => ({ territory_id: 't1' })),
      ...Array.from({ length: 90 }, () => ({ territory_id: 't2' })),
    ] })
    mockContactCount.mockResolvedValueOnce({ data: [
      ...Array.from({ length: 100 }, () => ({ district: 'Sur' })),
      ...Array.from({ length: 100 }, () => ({ district: 'Norte' })),
    ] })
    mockRecentVisits.mockResolvedValue({ data: [] })

    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify(CLAUDE_PROPOSAL),
    })

    const res  = await POST(makeRequest('secret123'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.proposals_created).toBe(1)
    expect(mockSuggestionsInsert).toHaveBeenCalledTimes(1)

    const inserted = mockSuggestionsInsert.mock.calls[0][0]
    expect(inserted.status).toBe('pending_approval')  // HITL
    expect(inserted.type).toBe('territory_redistribution')
  })
})

// ── HITL: always pending_approval ────────────────────────────────────────────

describe('POST /api/agents/territory-redistribution — HITL', () => {
  it('never inserts status=active (always pending_approval)', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockTerritoriesSelect.mockResolvedValue({ data: [{ id: 't1', name: 'Sur', priority: 'high' }] })
    mockVisitCount.mockResolvedValue({ data: Array.from({ length: 5 }, () => ({ territory_id: 't1' })) })
    mockContactCount.mockResolvedValue({ data: Array.from({ length: 100 }, () => ({ district: 'Sur' })) })
    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify(CLAUDE_PROPOSAL),
    })

    await POST(makeRequest('secret123'))

    if (mockSuggestionsInsert.mock.calls.length > 0) {
      const inserted = mockSuggestionsInsert.mock.calls[0][0]
      expect(inserted.status).not.toBe('active')
      expect(inserted.status).toBe('pending_approval')
    }
  })
})

// ── Deduplication ─────────────────────────────────────────────────────────────

describe('POST /api/agents/territory-redistribution — deduplication', () => {
  it('skips proposal when one already pending for campaign', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockTerritoriesSelect.mockResolvedValue({ data: [{ id: 't1', name: 'Sur', priority: 'high' }] })
    mockVisitCount.mockResolvedValue({ data: Array.from({ length: 5 }, () => ({ territory_id: 't1' })) })
    mockContactCount.mockResolvedValue({ data: Array.from({ length: 100 }, () => ({ district: 'Sur' })) })
    mockSuggestionsSelect.mockResolvedValue({ data: [{ id: 'existing' }] })  // already exists
    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify(CLAUDE_PROPOSAL),
    })

    const res  = await POST(makeRequest('secret123'))
    const body = await res.json()

    expect(body.proposals_created).toBe(0)
    expect(mockSuggestionsInsert).not.toHaveBeenCalled()
  })
})

// ── Resilience ────────────────────────────────────────────────────────────────

describe('POST /api/agents/territory-redistribution — resilience', () => {
  it('uses fallback proposal when Claude returns invalid JSON', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockTerritoriesSelect.mockResolvedValue({ data: [{ id: 't1', name: 'Sur', priority: 'high' }] })
    mockVisitCount.mockResolvedValue({ data: Array.from({ length: 5 }, () => ({ territory_id: 't1' })) })
    mockContactCount.mockResolvedValue({ data: Array.from({ length: 100 }, () => ({ district: 'Sur' })) })
    mockCallAI.mockResolvedValueOnce({
      content: 'no es JSON',
    })

    const res  = await POST(makeRequest('secret123'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.proposals_created).toBe(1)  // fallback proposal inserted
  })
})
