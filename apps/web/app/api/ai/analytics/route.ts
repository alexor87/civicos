import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'
import { SupabaseClient } from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsSuggestion {
  type:             string
  module:           string
  priority:         'critical' | 'high' | 'medium' | 'low'
  title:            string
  description:      string
  reasoning:        string
  estimated_impact: string
  action_payload:   Record<string, unknown>
}

interface CampaignMetrics {
  campaign_id:              string
  campaign_name:            string
  tenant_id:                string
  contacts_total:           number
  contacts_unvisited_30d:   number
  contacts_untagged_7d:     number
  territories_no_visits:    number
  stale_draft_campaigns:    { id: string; name: string; days_stale: number }[]
  inactive_volunteers:      { id: string; full_name: string }[]
}

// ── Auth helper ───────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail closed
  return req.headers.get('x-cron-secret') === secret
}

// ── Metrics collection ────────────────────────────────────────────────────────

async function collectMetrics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaign: { id: string; tenant_id: string; name: string }
): Promise<CampaignMetrics> {
  const campaignId = campaign.id
  const now        = new Date()
  const cutoff30d  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff7d   = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff14d  = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // Total contacts
  const { count: contacts_total = 0 } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId) as { count: number }

  // Contacts with no visit in 30+ days
  const { count: contacts_unvisited_30d = 0 } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .not('id', 'in',
      `(SELECT DISTINCT contact_id FROM canvass_visits WHERE created_at >= '${cutoff30d}')`
    ) as { count: number }

  // Contacts imported 7+ days ago with no tags
  const { count: contacts_untagged_7d = 0 } = await supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .lte('created_at', cutoff7d)
    .eq('tags', '{}') as { count: number }

  // Territories with 0 visits
  const { count: territories_no_visits = 0 } = await supabase
    .from('territories')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .not('id', 'in',
      `(SELECT DISTINCT territory_id FROM canvass_visits WHERE territory_id IS NOT NULL)`
    ) as { count: number }

  // Stale draft campaigns (email + SMS older than 7 days)
  const stale_draft_campaigns: { id: string; name: string; days_stale: number }[] = []

  for (const table of ['email_campaigns', 'sms_campaigns'] as const) {
    const { data: drafts } = await supabase
      .from(table)
      .select('id, name, created_at')
      .eq('campaign_id', campaignId)
      .eq('status', 'draft')
      .lte('created_at', cutoff7d)

    if (drafts) {
      for (const d of drafts) {
        const days = Math.floor((now.getTime() - new Date(d.created_at).getTime()) / 86_400_000)
        stale_draft_campaigns.push({ id: d.id, name: d.name, days_stale: days })
      }
    }
  }

  // Volunteers with no activity in 14+ days
  const { data: allVolunteers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'volunteer')

  const { data: recentVisitors } = await supabase
    .from('canvass_visits')
    .select('volunteer_id')
    .eq('campaign_id', campaignId)
    .gte('created_at', cutoff14d)

  const recentIds = new Set((recentVisitors ?? []).map(v => v.volunteer_id))
  const inactive_volunteers = (allVolunteers ?? []).filter(v => !recentIds.has(v.id))

  return {
    campaign_id:            campaignId,
    campaign_name:          campaign.name,
    tenant_id:              campaign.tenant_id,
    contacts_total:         contacts_total ?? 0,
    contacts_unvisited_30d: contacts_unvisited_30d ?? 0,
    contacts_untagged_7d:   contacts_untagged_7d ?? 0,
    territories_no_visits:  territories_no_visits ?? 0,
    stale_draft_campaigns,
    inactive_volunteers,
  }
}

// ── AI analysis ──────────────────────────────────────────────────────────────

async function analyzeWithAI(adminSupabase: SupabaseClient, metrics: CampaignMetrics): Promise<AnalyticsSuggestion[]> {
  const staleDraftsSummary = metrics.stale_draft_campaigns.length > 0
    ? metrics.stale_draft_campaigns.map(d => `  - "${d.name}" lleva ${d.days_stale} días en borrador`).join('\n')
    : '  - Ninguna'

  const inactiveVolsSummary = metrics.inactive_volunteers.length > 0
    ? metrics.inactive_volunteers.slice(0, 5).map(v => `  - ${v.full_name}`).join('\n')
    : '  - Ninguno'

  const prompt = `Analiza las siguientes métricas de la campaña electoral "${metrics.campaign_name}" y genera sugerencias accionables.

MÉTRICAS ACTUALES:
- Contactos totales: ${metrics.contacts_total}
- Contactos sin visita en 30+ días: ${metrics.contacts_unvisited_30d}
- Contactos importados hace 7+ días sin clasificar (sin tags): ${metrics.contacts_untagged_7d}
- Territorios sin ninguna visita: ${metrics.territories_no_visits}
- Campañas de email/SMS en borrador hace 7+ días:
${staleDraftsSummary}
- Voluntarios sin actividad en 14+ días:
${inactiveVolsSummary}

REGLAS:
- Solo genera sugerencias para problemas reales (valor > 0 o lista no vacía)
- Máximo 4 sugerencias por ejecución
- Prioriza por impacto en resultados electorales
- Si todo está bien, devuelve array vacío []

Devuelve ÚNICAMENTE un array JSON con esta estructura exacta (sin texto extra):
[
  {
    "type": "inactive_contacts|untagged_contacts|territories_without_visits|stale_draft_campaign|inactive_volunteers",
    "module": "crm|canvassing|communications|volunteers",
    "priority": "critical|high|medium|low",
    "title": "Título conciso (máx 60 chars)",
    "description": "Descripción del problema detectado (máx 120 chars)",
    "reasoning": "Por qué esto importa para la campaña",
    "estimated_impact": "Impacto estimado si se actúa",
    "action_payload": {}
  }
]`

  const aiResult = await callAI(adminSupabase, metrics.tenant_id, metrics.campaign_id, [
    { role: 'user', content: prompt },
  ], { maxTokens: 2048 })

  const text = (aiResult.content || '[]').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ── Deduplication ─────────────────────────────────────────────────────────────

async function getExistingActiveTypes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaignId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('ai_suggestions')
    .select('type')
    .eq('campaign_id', campaignId)
    .in('status', ['active', 'pending_approval'])

  return new Set((data ?? []).map(r => r.type))
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Fetch all active campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, tenant_id, name')
    .eq('is_active', true)

  if (!campaigns?.length) {
    return NextResponse.json({ processed: 0, suggestions_created: 0 })
  }

  const adminSupabase = createAdminClient()
  let suggestionsCreated = 0

  for (const campaign of campaigns) {
    try {
      const metrics          = await collectMetrics(supabase, campaign)
      const suggestions      = await analyzeWithAI(adminSupabase, metrics)
      const existingTypes    = await getExistingActiveTypes(supabase, campaign.id)

      for (const sug of suggestions) {
        // Skip if an active suggestion of the same type already exists
        if (existingTypes.has(sug.type)) continue

        const { error } = await supabase.from('ai_suggestions').insert({
          tenant_id:        metrics.tenant_id,
          campaign_id:      campaign.id,
          type:             sug.type,
          module:           sug.module,
          priority:         sug.priority,
          title:            sug.title,
          description:      sug.description,
          reasoning:        sug.reasoning,
          estimated_impact: sug.estimated_impact,
          action_payload:   sug.action_payload,
          agent_id:         'analytics-engine-v1',
          status:           'active',
        })

        if (!error) suggestionsCreated++
      }
    } catch {
      // Don't let one campaign failure block others
      continue
    }
  }

  return NextResponse.json({ processed: campaigns.length, suggestions_created: suggestionsCreated })
}
