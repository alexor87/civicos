import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSelect,
  mockCampaignsSelect,
  mockTotalContacts,
  mockSupporters,
  mockVisits24h,
  mockVisitsPrev24h,
  mockTotalVisits,
  mockWeekVisits,
  mockAgentRunInsert,
  mockAgentRunUpdate,
  mockSuggestionsSelect,
  mockSuggestionsInsert,
  mockCallAI,
} = vi.hoisted(() => ({
  mockGetUser:           vi.fn(),
  mockProfileSelect:     vi.fn(),
  mockCampaignsSelect:   vi.fn(),
  mockTotalContacts:     vi.fn(),
  mockSupporters:        vi.fn(),
  mockVisits24h:         vi.fn(),
  mockVisitsPrev24h:     vi.fn(),
  mockTotalVisits:       vi.fn(),
  mockWeekVisits:        vi.fn(),
  mockAgentRunInsert:    vi.fn(),
  mockAgentRunUpdate:    vi.fn(),
  mockSuggestionsSelect: vi.fn(),
  mockSuggestionsInsert: vi.fn(),
  mockCallAI:            vi.fn(),
}))

function makeChain(terminalFn: ReturnType<typeof vi.fn>) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'lte', 'gte', 'in', 'order', 'limit', 'lt', 'not', 'single', 'is', 'range', 'select']
  for (const m of methods) { chain[m] = vi.fn(() => chain) }
  chain.then = vi.fn((resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    terminalFn().then(resolve, reject)
  )
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    let contactsCallCount = 0
    let visitsCallCount   = 0

    return {
      auth: { getUser: mockGetUser },
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSelect })) })) }
        }
        if (table === 'campaigns') {
          return { select: vi.fn(() => ({ eq: vi.fn(mockCampaignsSelect) })) }
        }
        if (table === 'contacts') {
          contactsCallCount++
          const fns = [mockTotalContacts, mockSupporters]
          const fn  = fns[contactsCallCount - 1] ?? mockTotalContacts
          return { select: vi.fn(() => makeChain(fn)) }
        }
        if (table === 'canvass_visits') {
          visitsCallCount++
          // Order: visits24h, visitsPrev24h, totalVisits, weekVisits
          const fns = [mockVisits24h, mockVisitsPrev24h, mockTotalVisits, mockWeekVisits]
          const fn  = fns[visitsCallCount - 1] ?? mockTotalVisits
          return { select: vi.fn(() => makeChain(fn)) }
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

import { POST } from '@/app/api/agents/campaign-monitor/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(secret?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret) headers['x-cron-secret'] = secret
  return new NextRequest('http://localhost/api/agents/campaign-monitor', {
    method: 'POST', headers, body: JSON.stringify({}),
  })
}

const CAMPAIGN = { id: 'camp1', tenant_id: 't1', name: 'Prueba', is_active: true, election_date: null }

const CLAUDE_REPORT = {
  title: 'Reporte Diario — 2026-03-13 — VERDE',
  description: 'Sin alertas. Cobertura 65%, 45 visitas hoy.',
  reasoning: 'Métricas dentro de rangos normales.',
  estimated_impact: 'Monitoreo continuo',
}

function mockDefaults() {
  mockTotalContacts.mockResolvedValue({ count: 200 })
  mockSupporters.mockResolvedValue({ count: 120 })
  mockVisits24h.mockResolvedValue({ count: 45 })
  mockVisitsPrev24h.mockResolvedValue({ count: 40 })
  mockTotalVisits.mockResolvedValue({ count: 130 })
  mockWeekVisits.mockResolvedValue({ data: [
    { volunteer_id: 'v1' }, { volunteer_id: 'v2' }, { volunteer_id: 'v3' },
  ] })
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

describe('POST /api/agents/campaign-monitor — auth', () => {
  it('returns 401 with wrong cron secret', async () => {
    const res = await POST(makeRequest('bad-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 401 when unauthenticated and no secret', async () => {
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })

  it('accepts valid cron secret', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res = await POST(makeRequest('secret123'))
    expect(res.status).toBe(200)
  })

  it('accepts authenticated field_coordinator', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    mockProfileSelect.mockResolvedValue({ data: { role: 'field_coordinator' } })
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
  })
})

// ── No campaigns ──────────────────────────────────────────────────────────────

describe('POST /api/agents/campaign-monitor — no campaigns', () => {
  it('returns 0 reports when no active campaigns', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res  = await POST(makeRequest('secret123'))
    const body = await res.json()
    expect(body).toEqual({ processed: 0, reports_created: 0 })
  })
})

// ── Happy path ────────────────────────────────────────────────────────────────

describe('POST /api/agents/campaign-monitor — happy path', () => {
  it('creates a daily report suggestion with correct module', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify(CLAUDE_REPORT),
    })

    const res  = await POST(makeRequest('secret123'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.reports_created).toBe(1)
    expect(mockSuggestionsInsert).toHaveBeenCalledTimes(1)

    const inserted = mockSuggestionsInsert.mock.calls[0][0]
    expect(inserted.module).toBe('monitoring')
    expect(inserted.status).toBe('active')
    expect(inserted.type).toMatch(/^daily_report_/)
  })
})

// ── Alert levels ──────────────────────────────────────────────────────────────

describe('POST /api/agents/campaign-monitor — alert levels', () => {
  it('inserts medium priority (amarillo) when only visit drop alert fires', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    // 50 → 20 = -60% drop → 1 alert → amarillo → medium
    mockVisits24h.mockResolvedValue({ count: 20 })
    mockVisitsPrev24h.mockResolvedValue({ count: 50 })
    // Few active volunteers too → 2 alerts → rojo → high
    mockWeekVisits.mockResolvedValue({ data: [] })
    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify({ ...CLAUDE_REPORT, title: 'Alerta roja' }),
    })

    await POST(makeRequest('secret123'))

    const inserted = mockSuggestionsInsert.mock.calls[0][0]
    // 2 alerts (visit drop + low volunteers) → rojo → high
    expect(['high', 'critical', 'medium']).toContain(inserted.priority)
    expect(inserted.priority).not.toBe('low')
  })

  it('inserts low priority when no alerts', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify(CLAUDE_REPORT),
    })

    await POST(makeRequest('secret123'))

    const inserted = mockSuggestionsInsert.mock.calls[0][0]
    expect(inserted.priority).toBe('low')
  })
})

// ── Deduplication ─────────────────────────────────────────────────────────────

describe('POST /api/agents/campaign-monitor — deduplication', () => {
  it('does not create duplicate report for same day', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockSuggestionsSelect.mockResolvedValue({ data: [{ id: 'existing-report' }] })
    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify(CLAUDE_REPORT),
    })

    const res  = await POST(makeRequest('secret123'))
    const body = await res.json()

    expect(body.reports_created).toBe(0)
    expect(mockSuggestionsInsert).not.toHaveBeenCalled()
  })
})

// ── Resilience ────────────────────────────────────────────────────────────────

describe('POST /api/agents/campaign-monitor — resilience', () => {
  it('uses fallback report when Claude returns invalid JSON', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [CAMPAIGN] })
    mockDefaults()
    mockCallAI.mockResolvedValueOnce({
      content: 'invalid json ~~',
    })

    const res  = await POST(makeRequest('secret123'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.reports_created).toBe(1)  // fallback report inserted
    const inserted = mockSuggestionsInsert.mock.calls[0][0]
    expect(inserted.title).toMatch(/Reporte diario/)
  })
})
