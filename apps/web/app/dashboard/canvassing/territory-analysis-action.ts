'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TerritoryInsight {
  territory_id:    string
  territory_name:  string
  visits:          number
  positive_rate:   number   // 0-100
  coverage_gap:    boolean
  recommendation:  string
}

export interface VolunteerInsight {
  volunteer_id:    string
  volunteer_name:  string
  visits:          number
  positive_rate:   number   // 0-100
  needs_coaching:  boolean
  insight:         string
}

export interface TerritoryAnalysisReport {
  generated_at:              string
  period_days:               number
  total_visits:              number
  overall_sentiment:         'positivo' | 'neutral' | 'negativo'
  overall_assessment:        string
  coverage_summary:          string
  territory_insights:        TerritoryInsight[]
  volunteer_insights:        VolunteerInsight[]
  next_week_recommendations: string[]
}

export interface AnalysiResult {
  report?: TerritoryAnalysisReport
  error?:  string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

function positiveRate(visits: { result: string }[]): number {
  if (!visits.length) return 0
  const positives = visits.filter(v => ['positive', 'contacted'].includes(v.result)).length
  return Math.round((positives / visits.length) * 100)
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function analyzeTerritoryAction(): Promise<AnalysiResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return { error: 'No hay campaña activa' }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('id', campaignId)
    .single()

  const PERIOD_DAYS = 30
  const since = new Date(Date.now() - PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Fetch visits + territories in parallel
  const [{ data: visits }, { data: territories }] = await Promise.all([
    supabase
      .from('canvass_visits')
      .select('id, territory_id, volunteer_id, result, created_at, contacts(first_name, last_name), profiles!volunteer_id(full_name), territories(name, color)')
      .eq('campaign_id', campaignId)
      .gte('created_at', since),
    supabase
      .from('territories')
      .select('id, name, color, status, priority')
      .eq('campaign_id', campaignId),
  ])

  const visitList  = visits      ?? []
  const terrList   = territories ?? []

  // ── Build context for Claude ───────────────────────────────────────────────

  const visitsByTerritory = groupBy(visitList, v => v.territory_id ?? 'sin_territorio')
  const visitsByVolunteer = groupBy(visitList, v => v.volunteer_id ?? 'sin_voluntario')

  const territoryStats = terrList.map(t => {
    const tvs = visitsByTerritory[t.id] ?? []
    return {
      id:            t.id,
      name:          t.name,
      status:        t.status,
      visits:        tvs.length,
      positive_rate: positiveRate(tvs),
    }
  })

  const volunteerNames: Record<string, string> = {}
  for (const v of visitList) {
    const vol = v.profiles as { full_name?: string | null } | null
    if (v.volunteer_id && vol?.full_name) {
      volunteerNames[v.volunteer_id] = vol.full_name
    }
  }

  const volunteerStats = Object.entries(visitsByVolunteer).map(([volId, vvs]) => ({
    id:            volId,
    name:          volunteerNames[volId] ?? 'Desconocido',
    visits:        vvs.length,
    positive_rate: positiveRate(vvs),
  }))

  // ── Call Claude ────────────────────────────────────────────────────────────

  const prompt = `Analiza el rendimiento de canvassing de la campaña "${campaign?.name ?? campaignId}" en los últimos ${PERIOD_DAYS} días.

DATOS DE TERRITORIOS (${terrList.length} territorios):
${territoryStats.map(t => `- ${t.name} (${t.status}): ${t.visits} visitas, ${t.positive_rate}% positivas`).join('\n')}

DATOS DE VOLUNTARIOS (${volunteerStats.length} activos):
${volunteerStats.length ? volunteerStats.map(v => `- ${v.name}: ${v.visits} visitas, ${v.positive_rate}% positivas`).join('\n') : '- Sin actividad registrada'}

TOTAL: ${visitList.length} visitas en el período

Genera un análisis ejecutivo para el coordinador de campaña. Identifica:
1. Territorios con brecha de cobertura (0 visitas o < 30% positivas)
2. Voluntarios que necesitan coaching (< 25% positivas con 5+ visitas)
3. Qué priorizar la próxima semana

Devuelve ÚNICAMENTE este JSON (sin texto extra):
{
  "overall_sentiment": "positivo|neutral|negativo",
  "overall_assessment": "Resumen ejecutivo en 2 oraciones",
  "coverage_summary": "Estado de cobertura territorial en 1 oración",
  "territory_insights": [
    {
      "territory_id": "id",
      "territory_name": "nombre",
      "visits": 0,
      "positive_rate": 0,
      "coverage_gap": true,
      "recommendation": "Acción específica para este territorio"
    }
  ],
  "volunteer_insights": [
    {
      "volunteer_id": "id",
      "volunteer_name": "nombre",
      "visits": 0,
      "positive_rate": 0,
      "needs_coaching": false,
      "insight": "Observación sobre este voluntario"
    }
  ],
  "next_week_recommendations": [
    "Recomendación 1",
    "Recomendación 2",
    "Recomendación 3"
  ]
}`

  try {
    const adminSupabase = createAdminClient()
    const aiResult = await callAI(
      adminSupabase,
      profile.tenant_id,
      campaignId,
      [{ role: 'user', content: prompt }],
      { maxTokens: 2048 },
    )

    const text = aiResult.content || ''
    const parsed = JSON.parse(text)

    const report: TerritoryAnalysisReport = {
      generated_at:              new Date().toISOString(),
      period_days:               PERIOD_DAYS,
      total_visits:              visitList.length,
      overall_sentiment:         parsed.overall_sentiment ?? 'neutral',
      overall_assessment:        parsed.overall_assessment ?? '',
      coverage_summary:          parsed.coverage_summary ?? '',
      territory_insights:        parsed.territory_insights ?? [],
      volunteer_insights:        parsed.volunteer_insights ?? [],
      next_week_recommendations: parsed.next_week_recommendations ?? [],
    }

    return { report }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `No se pudo completar el análisis: ${msg}` }
  }
}
