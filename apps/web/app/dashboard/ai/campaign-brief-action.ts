'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BriefHealth = 'green' | 'yellow' | 'red'

export interface KpiChange {
  label:       string
  current:     number
  delta:       number
  direction:   'up' | 'down' | 'stable'
  is_positive: boolean
}

export interface BriefAction {
  priority: 'critical' | 'high' | 'medium'
  action:   string
  rationale: string
}

export interface CampaignBrief {
  health:      BriefHealth
  headline:    string
  kpi_changes: KpiChange[]
  anomalies:   string[]
  top_actions: BriefAction[]
  generated_at: string
}

export interface BriefResult {
  brief?: CampaignBrief
  error?: string
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function generateCampaignBrief(): Promise<BriefResult> {
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
    .select('id, name, candidate_name, election_date')
    .eq('id', campaignId)
    .single()

  const now     = new Date()
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const prev7dStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // ── Fetch all KPI data in parallel ─────────────────────────────────────────

  const [
    contactsRes,
    supportersRes,
    visitsRes,
    prevVisitsRes,
    emailCampsRes,
  ] = await Promise.all([
    supabase.from('contacts').select('id').eq('campaign_id', campaignId),
    supabase.from('contacts').select('id').eq('campaign_id', campaignId).eq('status', 'supporter'),
    supabase.from('canvass_visits').select('id').eq('campaign_id', campaignId).gte('created_at', since7d),
    supabase.from('canvass_visits').select('id').eq('campaign_id', campaignId).gte('created_at', prev7dStart).lt('created_at', since7d),
    supabase.from('email_campaigns').select('id, name, subject, recipient_count, sent_at, status').eq('campaign_id', campaignId).order('sent_at', { ascending: false }).limit(10),
  ])

  const totalContacts   = (contactsRes.data ?? []).length
  const totalSupporters = (supportersRes.data ?? []).length
  const visitsThisWeek  = (visitsRes.data ?? []).length
  const visitsPrevWeek  = (prevVisitsRes.data ?? []).length
  const emailCamps      = emailCampsRes.data ?? []
  const sentCamps       = emailCamps.filter(c => c.status === 'sent')

  const supportRate = totalContacts > 0 ? Math.round((totalSupporters / totalContacts) * 100) : 0

  // ── Build prompt ───────────────────────────────────────────────────────────

  const prompt = `Genera un informe ejecutivo de campaña para el Campaign Manager de "${campaign?.name ?? campaignId}".

DATOS ACTUALES DE LA CAMPAÑA:
- Contactos totales: ${totalContacts}
- Simpatizantes: ${totalSupporters} (${supportRate}% del total)
- Visitas de canvassing esta semana: ${visitsThisWeek}
- Visitas semana anterior: ${visitsPrevWeek}
- Campañas de email enviadas en últimos 30 días: ${sentCamps.length}
- Total destinatarios alcanzados por email: ${sentCamps.reduce((s, c) => s + (c.recipient_count ?? 0), 0)}

HISTORIAL DE EMAILS RECIENTES:
${sentCamps.slice(0, 5).map(c => `- "${c.subject}" → ${c.recipient_count} destinatarios (${c.sent_at?.slice(0, 10) ?? 'sin fecha'})`).join('\n') || '- Sin campañas enviadas'}

Analiza estos datos y genera un informe ejecutivo. Detecta anomalías (ej: caída en visitas, sin actividad de email, bajo % simpatizantes) y sugiere acciones correctivas.

Devuelve ÚNICAMENTE este JSON (sin texto extra):
{
  "health": "green|yellow|red",
  "headline": "Una sola frase ejecutiva que resume el estado de la campaña",
  "kpi_changes": [
    { "label": "Contactos", "current": ${totalContacts}, "delta": 0, "direction": "stable", "is_positive": true },
    { "label": "Simpatizantes", "current": ${totalSupporters}, "delta": 0, "direction": "stable", "is_positive": true },
    { "label": "Visitas (semana)", "current": ${visitsThisWeek}, "delta": ${visitsThisWeek - visitsPrevWeek}, "direction": "${visitsThisWeek >= visitsPrevWeek ? 'up' : 'down'}", "is_positive": ${visitsThisWeek >= visitsPrevWeek} }
  ],
  "anomalies": ["anomalía detectada 1", "anomalía detectada 2"],
  "top_actions": [
    { "priority": "critical|high|medium", "action": "Acción concreta a tomar", "rationale": "Por qué es importante" }
  ]
}`

  // ── Call Claude ────────────────────────────────────────────────────────────

  try {
    const adminSupabase = createAdminClient()
    const aiResult = await callAI(
      adminSupabase,
      profile.tenant_id,
      campaignId,
      [{ role: 'user', content: prompt }],
      { maxTokens: 1024 },
    )

    const text = (aiResult.content || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const parsed = JSON.parse(text)

    const brief: CampaignBrief = {
      health:       parsed.health       ?? 'yellow',
      headline:     parsed.headline     ?? '',
      kpi_changes:  parsed.kpi_changes  ?? [],
      anomalies:    parsed.anomalies    ?? [],
      top_actions:  parsed.top_actions  ?? [],
      generated_at: now.toISOString(),
    }

    // Log to agent_runs
    await supabase.from('agent_runs').insert({
      campaign_id: campaignId,
      agent_id:    'kpi-monitor-v1',
      workflow_id: 'campaign-brief',
      status:      'completed',
      trigger:     'on_demand',
      result:      brief,
      started_at:  now.toISOString(),
      completed_at: new Date().toISOString(),
    })

    return { brief }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `No se pudo generar el informe: ${msg}` }
  }
}
