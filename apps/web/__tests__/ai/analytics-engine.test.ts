import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockCampaignsSelect,
  mockContactsCount,
  mockUnvisitedCount,
  mockUntaggedCount,
  mockTerritoriesCount,
  mockRefusalCount,
  mockDraftCampaignsSelect,
  mockVolunteersCount,
  mockSuggestionsSelect,
  mockSuggestionsInsert,
  mockCallAI,
} = vi.hoisted(() => ({
  mockGetUser:            vi.fn(),
  mockCampaignsSelect:    vi.fn(),
  mockContactsCount:      vi.fn(),
  mockUnvisitedCount:     vi.fn(),
  mockUntaggedCount:      vi.fn(),
  mockTerritoriesCount:   vi.fn(),
  mockRefusalCount:       vi.fn(),
  mockDraftCampaignsSelect: vi.fn(),
  mockVolunteersCount:    vi.fn(),
  mockSuggestionsSelect:  vi.fn(),
  mockSuggestionsInsert:  vi.fn(),
  mockCallAI:             vi.fn(),
}))

// Helper: builds a fully-chainable Supabase query builder that resolves via `then`
function makeChain(terminalFn: ReturnType<typeof vi.fn>) {
  const chain: Record<string, unknown> = {}
  const methods = ['eq', 'lte', 'gte', 'in', 'order', 'single', 'limit', 'range']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  // .not() and .select() are terminal-ish — proxy to terminalFn
  chain.not = vi.fn(terminalFn)
  // Make the chain itself thenable (so `await chain` works)
  chain.then = vi.fn((resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    terminalFn().then(resolve, reject)
  )
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    // Track how many times .from('contacts').select() has been called
    // to return the right mock per query (total → unvisited → untagged)
    let contactsSelectCallCount = 0

    return {
      auth: { getUser: mockGetUser },
      from: vi.fn((table: string) => {
        if (table === 'campaigns') {
          return { select: vi.fn(() => ({ eq: vi.fn(mockCampaignsSelect) })) }
        }

        if (table === 'contacts') {
          contactsSelectCallCount++
          const callNum = contactsSelectCallCount
          // Query 1 → contacts_total (resolved via chain.then)
          // Query 2 → contacts_unvisited_30d (resolved via .not())
          // Query 3 → contacts_untagged_7d (resolved via chain.then after .lte().eq())
          const resolveFn = callNum === 2 ? mockUnvisitedCount
                          : callNum === 3 ? mockUntaggedCount
                          : mockContactsCount
          const chain = makeChain(resolveFn)
          return { select: vi.fn(() => chain) }
        }

        if (table === 'territories') {
          const chain = makeChain(mockTerritoriesCount)
          return { select: vi.fn(() => chain) }
        }

        if (table === 'canvass_visits') {
          // .select().eq().gte() — gte is proxied as chain method, so make chain thenable
          const chain = makeChain(mockRefusalCount)
          return { select: vi.fn(() => chain) }
        }

        if (table === 'email_campaigns' || table === 'sms_campaigns') {
          // .select().eq().eq().lte() — lte is chained, resolve via chain.then
          const chain = makeChain(mockDraftCampaignsSelect)
          return { select: vi.fn(() => chain) }
        }

        if (table === 'profiles') {
          return { select: vi.fn(() => ({ eq: vi.fn(mockVolunteersCount) })) }
        }

        if (table === 'ai_suggestions') {
          return {
            select: vi.fn(() => ({ eq: vi.fn(() => ({ in: vi.fn(mockSuggestionsSelect) })) })),
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
  createAdminClient: vi.fn(() => ({})),
}))

import { POST } from '@/app/api/ai/analytics/route'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeRequest(secret = 'test-secret') {
  return new NextRequest('http://localhost/api/ai/analytics', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'x-cron-secret': secret,
    },
    body: JSON.stringify({}),
  })
}

const VALID_CAMPAIGN = { id: 'camp1', tenant_id: 't1', name: 'Campaña Test', is_active: true }

const CLAUDE_SUGGESTIONS = [
  {
    type:             'inactive_contacts',
    module:           'crm',
    priority:         'high',
    title:            'Retomar 45 contactos inactivos',
    description:      'Hay 45 contactos sin visita en los últimos 30 días.',
    reasoning:        'La actividad de contacto ha caído. Reengagement aumenta probabilidad de voto.',
    estimated_impact: 'Recuperar ~20% de contactos inactivos',
    action_payload:   { contacts_count: 45, days_inactive: 30 },
  },
]

function mockClaudeResponse(suggestions = CLAUDE_SUGGESTIONS) {
  mockCallAI.mockResolvedValueOnce({
    content: JSON.stringify(suggestions),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET       = 'test-secret'
  process.env.ANTHROPIC_API_KEY = 'test-key'
  // Default: no existing active suggestions of the same type
  mockSuggestionsSelect.mockResolvedValue({ data: [] })
  mockSuggestionsInsert.mockResolvedValue({ error: null })
})

// ── Auth ──────────────────────────────────────────────────────────────────────

describe('POST /api/ai/analytics — auth', () => {
  it('returns 401 when x-cron-secret is missing', async () => {
    const req = new NextRequest('http://localhost/api/ai/analytics', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when x-cron-secret is wrong', async () => {
    const res = await POST(makeRequest('wrong-secret'))
    expect(res.status).toBe(401)
  })

  it('returns 200 when secret is correct', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })
    const res = await POST(makeRequest('test-secret'))
    expect(res.status).toBe(200)
  })
})

// ── No campaigns ──────────────────────────────────────────────────────────────

describe('POST /api/ai/analytics — no active campaigns', () => {
  it('returns { processed: 0 } when no active campaigns exist', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [] })

    const res  = await POST(makeRequest())
    const body = await res.json()
    expect(body).toEqual({ processed: 0, suggestions_created: 0 })
  })
})

// ── Metrics collection ────────────────────────────────────────────────────────

describe('POST /api/ai/analytics — metrics', () => {
  it('calls Claude with campaign metrics and inserts suggestions', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [VALID_CAMPAIGN] })
    // All metric queries return empty/zero so Claude gets a clean context
    mockContactsCount.mockResolvedValue({ count: 100 })
    mockUnvisitedCount.mockResolvedValue({ data: [], count: 45 })
    mockUntaggedCount.mockResolvedValue({ data: [], count: 12 })
    mockTerritoriesCount.mockResolvedValue({ data: [], count: 3 })
    mockRefusalCount.mockResolvedValue({ data: [] })
    mockDraftCampaignsSelect.mockResolvedValue({ data: [] })
    mockVolunteersCount.mockResolvedValue({ data: [] })
    mockClaudeResponse()

    const res  = await POST(makeRequest())
    const body = await res.json()

    expect(mockCallAI).toHaveBeenCalledTimes(1)
    expect(body.processed).toBe(1)
    expect(body.suggestions_created).toBe(1)
    expect(mockSuggestionsInsert).toHaveBeenCalledTimes(1)
  })
})

// ── Deduplication ─────────────────────────────────────────────────────────────

describe('POST /api/ai/analytics — deduplication', () => {
  it('skips inserting if active suggestion of same type already exists', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [VALID_CAMPAIGN] })
    mockContactsCount.mockResolvedValue({ count: 100 })
    mockUnvisitedCount.mockResolvedValue({ data: [], count: 45 })
    mockUntaggedCount.mockResolvedValue({ data: [], count: 0 })
    mockTerritoriesCount.mockResolvedValue({ data: [], count: 0 })
    mockRefusalCount.mockResolvedValue({ data: [] })
    mockDraftCampaignsSelect.mockResolvedValue({ data: [] })
    mockVolunteersCount.mockResolvedValue({ data: [] })
    mockClaudeResponse()

    // Simulate existing active suggestion of the same type
    mockSuggestionsSelect.mockResolvedValueOnce({
      data: [{ id: 'existing', type: 'inactive_contacts', status: 'active' }],
    })

    const res  = await POST(makeRequest())
    const body = await res.json()

    expect(body.suggestions_created).toBe(0)
    expect(mockSuggestionsInsert).not.toHaveBeenCalled()
  })
})

// ── Stale draft campaigns ─────────────────────────────────────────────────────

describe('POST /api/ai/analytics — stale draft campaigns', () => {
  it('generates communications suggestion when draft campaign is 7+ days old', async () => {
    const staleDraft = {
      id:   'email1',
      name: 'Campaña Agosto',
      status: 'draft',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    }

    mockCampaignsSelect.mockResolvedValueOnce({ data: [VALID_CAMPAIGN] })
    mockContactsCount.mockResolvedValue({ count: 50 })
    mockUnvisitedCount.mockResolvedValue({ data: [], count: 0 })
    mockUntaggedCount.mockResolvedValue({ data: [], count: 0 })
    mockTerritoriesCount.mockResolvedValue({ data: [], count: 0 })
    mockRefusalCount.mockResolvedValue({ data: [] })
    mockDraftCampaignsSelect.mockResolvedValue({ data: [staleDraft] })
    mockVolunteersCount.mockResolvedValue({ data: [] })

    const communicationsSuggestion = [{
      type:           'stale_draft_campaign',
      module:         'communications',
      priority:       'medium',
      title:          'Campaña de email sin enviar hace 8 días',
      description:    '"Campaña Agosto" lleva 8 días como borrador.',
      reasoning:      'Las campañas enviadas oportunamente tienen mayor engagement.',
      estimated_impact: 'Recuperar ventana de comunicación',
      action_payload: { campaign_id: 'email1', campaign_name: 'Campaña Agosto', days_stale: 8 },
    }]
    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify(communicationsSuggestion),
    })

    const res  = await POST(makeRequest())
    const body = await res.json()

    expect(body.suggestions_created).toBe(1)
    const insertedRow = mockSuggestionsInsert.mock.calls[0][0]
    expect(insertedRow.module).toBe('communications')
    expect(insertedRow.type).toBe('stale_draft_campaign')
  })
})

// ── Inactive volunteers ───────────────────────────────────────────────────────

describe('POST /api/ai/analytics — inactive volunteers', () => {
  it('generates volunteers suggestion when volunteers are inactive 14+ days', async () => {
    const inactiveVolunteers = [
      { id: 'v1', full_name: 'María López', role: 'volunteer' },
      { id: 'v2', full_name: 'Carlos Ruiz', role: 'volunteer' },
    ]

    mockCampaignsSelect.mockResolvedValueOnce({ data: [VALID_CAMPAIGN] })
    mockContactsCount.mockResolvedValue({ count: 100 })
    mockUnvisitedCount.mockResolvedValue({ data: [], count: 0 })
    mockUntaggedCount.mockResolvedValue({ data: [], count: 0 })
    mockTerritoriesCount.mockResolvedValue({ data: [], count: 0 })
    mockRefusalCount.mockResolvedValue({ data: [] })
    mockDraftCampaignsSelect.mockResolvedValue({ data: [] })
    mockVolunteersCount.mockResolvedValue({ data: inactiveVolunteers })

    const volunteersSuggestion = [{
      type:           'inactive_volunteers',
      module:         'volunteers',
      priority:       'medium',
      title:          '2 voluntarios sin actividad en 14+ días',
      description:    'María López y Carlos Ruiz no han registrado visitas en 2 semanas.',
      reasoning:      'Los voluntarios inactivos reducen la cobertura de canvassing.',
      estimated_impact: 'Reactivar voluntarios puede aumentar visitas en 30%',
      action_payload: { volunteer_ids: ['v1', 'v2'], days_inactive: 14 },
    }]
    mockCallAI.mockResolvedValueOnce({
      content: JSON.stringify(volunteersSuggestion),
    })

    const res  = await POST(makeRequest())
    const body = await res.json()

    expect(body.suggestions_created).toBe(1)
    const insertedRow = mockSuggestionsInsert.mock.calls[0][0]
    expect(insertedRow.module).toBe('volunteers')
  })
})

// ── Claude parse error fallback ───────────────────────────────────────────────

describe('POST /api/ai/analytics — resilience', () => {
  it('handles malformed Claude response gracefully (no crash)', async () => {
    mockCampaignsSelect.mockResolvedValueOnce({ data: [VALID_CAMPAIGN] })
    mockContactsCount.mockResolvedValue({ count: 100 })
    mockUnvisitedCount.mockResolvedValue({ data: [], count: 0 })
    mockUntaggedCount.mockResolvedValue({ data: [], count: 0 })
    mockTerritoriesCount.mockResolvedValue({ data: [], count: 0 })
    mockRefusalCount.mockResolvedValue({ data: [] })
    mockDraftCampaignsSelect.mockResolvedValue({ data: [] })
    mockVolunteersCount.mockResolvedValue({ data: [] })

    // Claude returns invalid JSON
    mockCallAI.mockResolvedValueOnce({
      content: 'Lo siento, no pude analizar los datos.',
    })

    const res  = await POST(makeRequest())
    const body = await res.json()

    // Should complete without error, just 0 suggestions created
    expect(res.status).toBe(200)
    expect(body.suggestions_created).toBe(0)
    expect(mockSuggestionsInsert).not.toHaveBeenCalled()
  })
})
