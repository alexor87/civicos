import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks ───────────────────────────────────────────────────────────────
const {
  mockGetUser,
  mockProfileSingle,
  mockCampaignSingle,
  mockVisitsQuery,
  mockTerritoriesQuery,
  mockVolunteersQuery,
  mockClaudeCreate,
} = vi.hoisted(() => ({
  mockGetUser:         vi.fn(),
  mockProfileSingle:   vi.fn(),
  mockCampaignSingle:  vi.fn(),
  mockVisitsQuery:     vi.fn(),
  mockTerritoriesQuery:vi.fn(),
  mockVolunteersQuery: vi.fn(),
  mockClaudeCreate:    vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === 'profiles') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockProfileSingle })) })) }
      }
      if (table === 'campaigns') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockCampaignSingle })) })) }
      }
      if (table === 'canvass_visits') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => mockVisitsQuery()),
            })),
          })),
        }
      }
      if (table === 'territories') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => mockTerritoriesQuery()),
          })),
        }
      }
      if (table === 'profiles' || table === 'volunteers') {
        return { select: vi.fn(() => ({ eq: vi.fn(() => mockVolunteersQuery()) })) }
      }
      return {}
    }),
  })),
}))

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(function () {
    return { messages: { create: mockClaudeCreate } }
  }),
}))

import { analyzeTerritoryAction } from '@/app/dashboard/canvassing/territory-analysis-action'

const MOCK_VISITS = [
  { id: 'v1', territory_id: 't1', volunteer_id: 'vol1', result: 'positive', created_at: new Date().toISOString(),
    contacts: { first_name: 'Ana', last_name: 'García' },
    profiles: { full_name: 'Carlos Perez' },
    territories: { name: 'Norte', color: '#2960ec' } },
  { id: 'v2', territory_id: 't1', volunteer_id: 'vol1', result: 'negative', created_at: new Date().toISOString(),
    contacts: { first_name: 'Luis', last_name: 'Martínez' },
    profiles: { full_name: 'Carlos Perez' },
    territories: { name: 'Norte', color: '#2960ec' } },
  { id: 'v3', territory_id: 't2', volunteer_id: 'vol2', result: 'positive', created_at: new Date().toISOString(),
    contacts: { first_name: 'María', last_name: 'López' },
    profiles: { full_name: 'Diego Ríos' },
    territories: { name: 'Sur', color: '#28a745' } },
]

const MOCK_TERRITORIES = [
  { id: 't1', name: 'Norte', color: '#2960ec', status: 'en_progreso', priority: 1 },
  { id: 't2', name: 'Sur', color: '#28a745', status: 'en_progreso', priority: 2 },
  { id: 't3', name: 'Centro', color: '#f8cf0c', status: 'pendiente', priority: 3 },
]

const MOCK_CLAUDE_RESPONSE = {
  overall_assessment: 'La campaña avanza bien en Norte y Sur, pero Centro necesita atención urgente.',
  overall_sentiment: 'neutral',
  coverage_summary: '2 de 3 territorios tienen actividad reciente.',
  territory_insights: [
    { territory_id: 't3', territory_name: 'Centro', visits: 0, positive_rate: 0, coverage_gap: true, recommendation: 'Asignar voluntarios urgente' },
  ],
  volunteer_insights: [
    { volunteer_id: 'vol1', volunteer_name: 'Carlos Perez', visits: 2, positive_rate: 50, needs_coaching: false, insight: 'Buen ritmo' },
  ],
  next_week_recommendations: ['Priorizar Centro', 'Mantener Norte', 'Reforzar equipo'],
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  mockProfileSingle.mockResolvedValue({
    data: { tenant_id: 'tenant1', campaign_ids: ['camp1'], role: 'campaign_manager' },
  })
  mockCampaignSingle.mockResolvedValue({ data: { id: 'camp1', name: 'Campaña Test' } })
  mockVisitsQuery.mockResolvedValue({ data: MOCK_VISITS })
  mockTerritoriesQuery.mockResolvedValue({ data: MOCK_TERRITORIES })
  mockVolunteersQuery.mockResolvedValue({ data: [] })
  mockClaudeCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(MOCK_CLAUDE_RESPONSE) }],
  })
})

describe('analyzeTerritoryAction', () => {
  it('returns error when unauthenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })
    const result = await analyzeTerritoryAction()
    expect(result.error).toBe('No autorizado')
  })

  it('returns error when user has no campaign', async () => {
    mockProfileSingle.mockResolvedValueOnce({
      data: { tenant_id: 'tenant1', campaign_ids: [], role: 'campaign_manager' },
    })
    const result = await analyzeTerritoryAction()
    expect(result.error).toBe('No hay campaña activa')
  })

  it('returns structured analysis report on success', async () => {
    const result = await analyzeTerritoryAction()
    expect(result.error).toBeUndefined()
    expect(result.report).toBeDefined()
    expect(result.report?.overall_assessment).toBe(MOCK_CLAUDE_RESPONSE.overall_assessment)
    expect(result.report?.overall_sentiment).toBe('neutral')
    expect(result.report?.next_week_recommendations).toHaveLength(3)
  })

  it('includes territory_insights in report', async () => {
    const result = await analyzeTerritoryAction()
    expect(result.report?.territory_insights).toBeDefined()
    expect(Array.isArray(result.report?.territory_insights)).toBe(true)
  })

  it('includes volunteer_insights in report', async () => {
    const result = await analyzeTerritoryAction()
    expect(result.report?.volunteer_insights).toBeDefined()
    expect(Array.isArray(result.report?.volunteer_insights)).toBe(true)
  })

  it('includes total_visits and generated_at in report', async () => {
    const result = await analyzeTerritoryAction()
    expect(typeof result.report?.total_visits).toBe('number')
    expect(result.report?.generated_at).toBeDefined()
  })

  it('handles Claude API error gracefully', async () => {
    mockClaudeCreate.mockRejectedValueOnce(new Error('API timeout'))
    const result = await analyzeTerritoryAction()
    expect(result.error).toContain('análisis')
  })

  it('handles malformed Claude response gracefully', async () => {
    mockClaudeCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'not valid json {{' }],
    })
    const result = await analyzeTerritoryAction()
    expect(result.error).toBeDefined()
  })
})
