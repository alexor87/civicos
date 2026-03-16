import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase mock ──────────────────────────────────────────────────────────────
const mockInsert        = vi.fn().mockResolvedValue({ error: null })
const mockGetUser       = vi.fn()
const mockProfileSingle = vi.fn()
const mockCampaignSingle= vi.fn()
const mockEmailList     = vi.fn().mockResolvedValue({ data: [], error: null })
const mockContactsList  = vi.fn().mockResolvedValue({ data: [], error: null })

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
      if (table === 'contacts')        return makeChain(mockContactsList)
      if (table === 'agent_runs')      return { insert: mockInsert }
      return makeChain(mockContactsList)
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

import { analyzeSmartComms } from '@/app/dashboard/comunicaciones/smart-comms-action'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const PROFILE_OK  = { data: { tenant_id: 't1', campaign_ids: ['c1'], role: 'campaign_manager' }, error: null }
const CAMPAIGN_OK = { data: { id: 'c1', name: 'Campaña Test', candidate_name: 'Ana Pérez', key_topics: 'empleo,seguridad' }, error: null }
const EMAIL_CAMPS = {
  data: [
    { id: 'e1', subject: 'Únete al mitin', sent_at: '2026-03-04T19:00:00Z', recipient_count: 1200, status: 'sent' },
    { id: 'e2', subject: 'Nueva propuesta', sent_at: '2026-02-25T19:30:00Z', recipient_count: 980, status: 'sent' },
  ],
  error: null,
}
const CONTACTS_STALE = { data: [{ id: 'ct1' }, { id: 'ct2' }, { id: 'ct3' }], error: null }

const REPORT_JSON = JSON.stringify({
  optimal_send: {
    day_of_week: 'martes',
    hour: 19,
    rationale: 'Los martes a las 7pm tienen mayor tasa de apertura histórica.',
    confidence: 'high',
  },
  subject_variants: [
    { variant: 'Únete al cambio que tu ciudad necesita', tone: 'motivacional', why: 'Apela a la pertenencia' },
    { variant: 'Tu voto puede transformar el futuro',    tone: 'urgente',      why: 'Sentido de urgencia'  },
    { variant: 'Propuesta concreta para el empleo',      tone: 'formal',       why: 'Enfoque en propuesta' },
  ],
  reengagement: {
    count: 3,
    segment_description: '3 contactos sin actividad en más de 30 días',
    suggested_message: 'Hola {nombre}, te echamos de menos en la campaña.',
  },
})

function makeClaudeResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

function setupHappyPath(topic?: string) {
  mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
  mockProfileSingle.mockResolvedValueOnce(PROFILE_OK)
  mockCampaignSingle.mockResolvedValueOnce(CAMPAIGN_OK)
  mockEmailList.mockResolvedValueOnce(EMAIL_CAMPS)
  mockContactsList.mockResolvedValueOnce(CONTACTS_STALE)
  mockClaudeCreate.mockResolvedValueOnce(makeClaudeResponse(REPORT_JSON))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockInsert.mockResolvedValue({ error: null })
  mockEmailList.mockResolvedValue({ data: [], error: null })
  mockContactsList.mockResolvedValue({ data: [], error: null })
})

describe('analyzeSmartComms', () => {
  it('returns error when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const result = await analyzeSmartComms()
    expect(result.error).toBeTruthy()
    expect(result.report).toBeUndefined()
  })

  it('returns error when user has no campaign', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 't1', campaign_ids: [], role: 'campaign_manager' }, error: null,
    })
    const result = await analyzeSmartComms()
    expect(result.error).toBeTruthy()
  })

  it('returns optimal_send with day and hour', async () => {
    setupHappyPath()
    const result = await analyzeSmartComms()
    expect(result.error).toBeUndefined()
    expect(result.report?.optimal_send?.day_of_week).toBe('martes')
    expect(result.report?.optimal_send?.hour).toBe(19)
  })

  it('returns 3 subject_variants', async () => {
    setupHappyPath()
    const result = await analyzeSmartComms()
    expect(result.report?.subject_variants).toHaveLength(3)
    expect(result.report?.subject_variants[0].variant).toBeTruthy()
  })

  it('returns reengagement count', async () => {
    setupHappyPath()
    const result = await analyzeSmartComms()
    expect(result.report?.reengagement?.count).toBe(3)
    expect(result.report?.reengagement?.suggested_message).toBeTruthy()
  })

  it('accepts optional topic and includes it in the Claude prompt', async () => {
    setupHappyPath()
    await analyzeSmartComms('empleo y educación', 'formal')
    const callArg = mockClaudeCreate.mock.calls[0][0]
    expect(callArg.messages[0].content).toContain('empleo y educación')
  })

  it('saves run to agent_runs table', async () => {
    setupHappyPath()
    await analyzeSmartComms()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ agent_id: 'smart-comms-v1' })
    )
  })

  it('handles Claude API error gracefully', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce(PROFILE_OK)
    mockCampaignSingle.mockResolvedValueOnce(CAMPAIGN_OK)
    mockEmailList.mockResolvedValueOnce(EMAIL_CAMPS)
    mockContactsList.mockResolvedValueOnce(CONTACTS_STALE)
    mockClaudeCreate.mockRejectedValueOnce(new Error('Rate limit'))
    const result = await analyzeSmartComms()
    expect(result.error).toBeTruthy()
    expect(result.report).toBeUndefined()
  })

  it('handles malformed JSON from Claude gracefully', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } } })
    mockProfileSingle.mockResolvedValueOnce(PROFILE_OK)
    mockCampaignSingle.mockResolvedValueOnce(CAMPAIGN_OK)
    mockEmailList.mockResolvedValueOnce(EMAIL_CAMPS)
    mockContactsList.mockResolvedValueOnce(CONTACTS_STALE)
    mockClaudeCreate.mockResolvedValueOnce(makeClaudeResponse('{{invalid json'))
    const result = await analyzeSmartComms()
    expect(result.error).toBeTruthy()
  })
})
