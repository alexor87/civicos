import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'
import { resolveThresholds } from '@/lib/agents/thresholds'
import { checkAgentRateLimit } from '@/lib/agent-rate-limit'
import { sanitizeForPrompt } from '@/lib/security/sanitize'

// Agent 5 — Campaign Monitor
// Collects daily KPIs, detects anomalies, generates a daily report suggestion.
// Can be triggered manually from the AI Center or via nightly pg_cron.

const AGENT_ID = 'agent-campaign-monitor'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // fail closed
  return req.headers.get('x-cron-secret') === secret
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const isCron = isAuthorized(req)
  if (!isCron) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
    if (!['super_admin', 'campaign_manager', 'field_coordinator'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rl = checkAgentRateLimit(profile!.tenant_id, AGENT_ID)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit excedido. Máximo 10 ejecuciones manuales por hora.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) },
        }
      )
    }
  }

  const now = new Date()
  const cutoff24h = new Date(now.getTime() - 24 * 86_400_000).toISOString()
  const cutoffPrev24h = new Date(now.getTime() - 48 * 86_400_000).toISOString()
  const cutoff7d = new Date(now.getTime() - 7 * 86_400_000).toISOString()
  const today = now.toISOString().slice(0, 10)

  // C-5: use admin client — cron has no user session, RLS would block
  const adminSupabase = createAdminClient()
  const { data: campaigns, error: campaignsError } = await adminSupabase
    .from('campaigns')
    .select('id, tenant_id, name, election_date, config')
    .eq('is_active', true)

  if (campaignsError || !campaigns?.length) {
    console.error('[campaign-monitor] No campaigns found or error:', campaignsError)
    return NextResponse.json({ processed: 0, reports_created: 0 })
  }
  let reportsCreated = 0

  for (const campaign of campaigns) {
    if (campaign.election_date && new Date(campaign.election_date) < now) continue

    const daysToElection = campaign.election_date
      ? Math.ceil((new Date(campaign.election_date).getTime() - now.getTime()) / 86_400_000)
      : null

    const thresholds = resolveThresholds((campaign as Record<string, unknown>).config)

    const { data: runData } = await supabase
      .from('agent_runs')
      .insert({
        tenant_id: campaign.tenant_id, campaign_id: campaign.id,
        agent_id: AGENT_ID, workflow_id: 'campaign-monitor-v1',
        status: 'running', trigger: isCron ? 'cron_daily' : 'manual_ui',
        steps: [],
      }).select().single()

    const runId = runData?.id
    const steps: unknown[] = []

    try {
      const [
        { count: totalContacts },
        { count: supporters },
        { count: visits24h },
        { count: visitsPrev24h },
        { count: totalVisits },
      ] = await Promise.all([
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id),
        supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id).eq('status', 'supporter'),
        supabase.from('canvass_visits').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id).gte('created_at', cutoff24h),
        supabase.from('canvass_visits').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id).gte('created_at', cutoffPrev24h).lt('created_at', cutoff24h),
        supabase.from('canvass_visits').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id),
      ])

      // Active volunteers this week
      const { data: weekVisits } = await supabase
        .from('canvass_visits').select('volunteer_id')
        .eq('campaign_id', campaign.id).gte('created_at', cutoff7d)

      const activeVolunteers = new Set((weekVisits ?? []).map(v => v.volunteer_id).filter(Boolean)).size

      const supportRate = totalContacts ? Math.round(((supporters ?? 0) / totalContacts) * 100) : 0
      const coverageRate = totalContacts ? Math.round(((totalVisits ?? 0) / totalContacts) * 100) : 0
      const visitDelta = (visits24h ?? 0) - (visitsPrev24h ?? 0)
      const visitDropPct = visitsPrev24h
        ? Math.round(((visitsPrev24h - (visits24h ?? 0)) / visitsPrev24h) * 100) : 0

      steps.push({ step: 'collect_kpis', completed_at: new Date().toISOString() })

      // Anomaly detection
      const alerts: string[] = []
      if (visitsPrev24h && visitDropPct > thresholds.visit_drop_pct) {
        alerts.push(`Caída de visitas: -${visitDropPct}% vs ayer (${visits24h} vs ${visitsPrev24h})`)
      }
      if (activeVolunteers < thresholds.inactive_volunteers_min && (totalContacts ?? 0) > 100) {
        alerts.push(`Voluntarios activos bajos esta semana: ${activeVolunteers}`)
      }

      const alertLevel = alerts.length === 0 ? 'verde' : alerts.length === 1 ? 'amarillo' : 'rojo'
      const priority = alertLevel === 'rojo' ? 'high' : alertLevel === 'amarillo' ? 'medium' : 'low'

      const safeName = sanitizeForPrompt(campaign.name, 200)
      const prompt = `Genera un reporte diario conciso para la campaña "${safeName}".

KPIs:
- Contactos totales: ${totalContacts ?? 0} | Simpatizantes: ${supporters ?? 0} (${supportRate}%)
- Visitas hoy: ${visits24h ?? 0} (${visitDelta >= 0 ? '+' : ''}${visitDelta} vs ayer)
- Cobertura canvassing: ${coverageRate}%
- Voluntarios activos (7d): ${activeVolunteers}
${daysToElection !== null ? `- Días para la elección: ${daysToElection}` : ''}

ALERTAS: ${alerts.length > 0 ? alerts.join(' | ') : 'Sin alertas'}
Nivel: ${alertLevel.toUpperCase()}

Responde SOLO con JSON:
{"title":"...","description":"...","reasoning":"...","estimated_impact":"..."}`

      const aiResult = await callAI(adminSupabase, campaign.tenant_id, campaign.id, [
        { role: 'user', content: prompt },
      ], { maxTokens: 600 })

      const text = aiResult.content || '{}'
      let report: { title: string; description: string; reasoning: string; estimated_impact: string }
      try { report = JSON.parse(text) }
      catch {
        report = {
          title: `Reporte diario — ${today} — ${alertLevel}`,
          description: alerts.length > 0 ? alerts.join('. ') : 'Sin alertas críticas.',
          reasoning: 'Análisis automático diario',
          estimated_impact: 'Monitoreo continuo',
        }
      }

      steps.push({ step: 'generate_report', alert_level: alertLevel, completed_at: new Date().toISOString() })

      // Deduplicate by date — only one report per campaign per day
      const reportType = `daily_report_${today}`
      const { data: existing } = await supabase.from('ai_suggestions').select('id')
        .eq('campaign_id', campaign.id).eq('type', reportType).in('status', ['active', 'pending_approval'])

      if (!existing?.length) {
        await supabase.from('ai_suggestions').insert({
          tenant_id: campaign.tenant_id, campaign_id: campaign.id,
          type: reportType, module: 'monitoring',
          priority: priority as 'critical' | 'high' | 'medium' | 'low',
          title: report.title, description: report.description,
          reasoning: report.reasoning, estimated_impact: report.estimated_impact,
          action_payload: {
            kpis: { totalContacts, supporters, supportRate, visits24h, visitsPrev24h, coverageRate, activeVolunteers },
            alerts, alert_level: alertLevel, days_to_election: daysToElection,
          },
          agent_id: AGENT_ID, status: 'active',
        })
        reportsCreated++
      }

      await supabase.from('agent_runs').update({
        status: 'completed', steps,
        result: { alert_level: alertLevel, alerts_count: alerts.length },
        completed_at: new Date().toISOString(),
      }).eq('id', runId)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      await supabase.from('agent_runs').update({ status: 'failed', steps, error: msg, completed_at: new Date().toISOString() }).eq('id', runId)
    }
  }

  return NextResponse.json({ processed: campaigns.length, reports_created: reportsCreated })
}
