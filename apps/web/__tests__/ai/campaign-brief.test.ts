import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockInsert        = vi.fn().mockResolvedValue({ error: null })
const mockGetUser       = vi.fn()
const mockProfileSingle = vi.fn()
const mockCampaignSingle= vi.fn()
const mockEmailList     = vi.fn().mockResolvedValue({ data: [], error: null })
const mockListDefault   = vi.fn().mockResolvedValue({ data: [], error: null })

function makeChain(resolveFn: () => unknown) {
  const q: Record<string, unknown> = {}
  q.select = vi.fn().mockReturnValue(q)
  q.eq     = vi.fn().mockReturnValue(q)
  q.neq    = vi.fn().mockReturnValue(q)
  q.gte    = vi.fn().mockReturnValue(q)
  q.lte    = vi.fn().mockReturnValue(q)
  q.lt     = vi.fn().mockReturnValue(q)
  q.not    = vi.fn().mockReturnValue(q)
  q.is     = vi.fn().mockReturnValue(q)
  q.in     = vi.fn().mockReturnValue(q)
  q.order  = vi.fn().mockReturnValue(q)
  q.limit  = vi.fn().mockReturnValue(q)
  q.single = vi.fn().mockImplementation(resolveFn)
  q.then   = vi.fn().mockImplementation(
    (cb: (v: unknown) => unknown) => Promise.resolve(resolveFn()).then(cb)
  )
  return q
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles')        return makeChain(mockProfileSingle)
      if (table === 'campaigns')       return makeChain(mockCampaignSingle)
      if (table === 'email_campaigns') return makeChain(mockEmailList)
      if (table === 'agent_runs')      return { insert: mockInsert }
      return makeChain(mockListDefault)
    }),
  })),
}))

// ── Anthropic mock ─────────────────────────────────────────────────────────────
const mockClaudeCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create: mockClaudeCreate } }
  }),
}))

import { generateCampaignBrief } from '@/app/dashboard/ai/campaign-brief-action'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const PROFILE_OK  = { data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' }, error: null }
const CAMPAIGN_OK = { data: { id: 'c1', name: 'Campaña Test', candidate_name: 'Ana Pérez', election_date: '2026-06-01' }, error: null }

const BRIEF_JSON = JSON.stringify({
  health: 'green',
  headline: 'La campaña avanza bien con 1,200 contactos alcanzados esta semana.',
  kpi_changes: [
    { label: 'Contactos',     current: 1200, delta: 80, direction: 'up',   is_positive: true  },
    { label: 'Simpatizantes', current: 340,  delta: 15, direction: 'up',   is_positive: true  },
    { label: 'Visitas (semana)', current: 45, delta: -5, direction: 'down', is_positive: false },
  ],
  anomalies: ['Zona norte con 0 visitas en 7 días'],
  top_actions: [
    { priority: 'high', action: 'Reasignar voluntarios a zona norte', rationale: 'Sin cobertura en 7 días' },
  ],
})

function makeClaudeResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

function setupHappyPath() {
  mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
  mockProfileSingle.mockResolvedValueOnce(PROFILE_OK)
  mockCampaignSingle.mockResolvedValueOnce(CAMPAIGN_OK)
  mockEmailList.mockResolvedValueOnce({ data: [], error: null })
  mockListDefault.mockResolvedValue({ data: [], error: null })
  mockClaudeCreate.mockResolvedValueOnce(makeClaudeResponse(BRIEF_JSON))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockInsert.mockResolvedValue({ error: null })
  mockListDefault.mockResolvedValue({ data: [], error: null })
  mockEmailList.mockResolvedValue({ data: [], error: null })
})

describe('generateCampaignBrief', () => {
  it('returns error when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const result = await generateCampaignBrief()
    expect(result.error).toBeTruthy()
    expect(result.brief).toBeUndefined()
  })

  it('returns error when user has no campaign', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: [], role: 'campaign_manager' }, error: null,
    })
    const result = await generateCampaignBrief()
    expect(result.error).toBeTruthy()
  })

  it('returns brief with health, headline, and kpi_changes', async () => {
    setupHappyPath()
    const result = await generateCampaignBrief()
    expect(result.error).toBeUndefined()
    expect(result.brief?.health).toBe('green')
    expect(result.brief?.headline).toContain('campaña')
    expect(result.brief?.kpi_changes.length).toBeGreaterThan(0)
  })

  it('includes anomalies in the brief', async () => {
    setupHappyPath()
    const result = await generateCampaignBrief()
    expect(result.brief?.anomalies).toContain('Zona norte con 0 visitas en 7 días')
  })

  it('includes top_actions with priority', async () => {
    setupHappyPath()
    const result = await generateCampaignBrief()
    expect(result.brief?.top_actions[0].priority).toBe('high')
    expect(result.brief?.top_actions[0].action).toBeTruthy()
  })

  it('saves run to agent_runs table', async () => {
    setupHappyPath()
    await generateCampaignBrief()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ agent_id: 'kpi-monitor-v1' })
    )
  })

  it('handles Claude API error gracefully', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce(PROFILE_OK)
    mockCampaignSingle.mockResolvedValueOnce(CAMPAIGN_OK)
    mockListDefault.mockResolvedValue({ data: [], error: null })
    mockEmailList.mockResolvedValueOnce({ data: [], error: null })
    mockClaudeCreate.mockRejectedValueOnce(new Error('API overloaded'))
    const result = await generateCampaignBrief()
    expect(result.error).toBeTruthy()
    expect(result.brief).toBeUndefined()
  })

  it('handles malformed Claude JSON gracefully', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce(PROFILE_OK)
    mockCampaignSingle.mockResolvedValueOnce(CAMPAIGN_OK)
    mockListDefault.mockResolvedValue({ data: [], error: null })
    mockEmailList.mockResolvedValueOnce({ data: [], error: null })
    mockClaudeCreate.mockResolvedValueOnce(makeClaudeResponse('not valid json {{{'))
    const result = await generateCampaignBrief()
    expect(result.error).toBeTruthy()
  })
})
