import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.78.0'

// Agent 5 — Monitoreo de Indicadores de Campaña
// Trigger: daily cron at 07:00 UTC OR manual HTTP POST with x-cron-secret
// Consolidates KPIs, detects anomalies (>20% drop vs 7-day avg),
// generates daily situation report, and suggests corrective actions.

const AGENT_ID = 'agent-campaign-monitor'
const WORKFLOW_ID = 'campaign-monitor-v1'

Deno.serve(async (req: Request) => {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const claude = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, tenant_id, name, election_date')
    .eq('is_active', true)

  if (!campaigns?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  let reportsCreated = 0
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const cutoff7d = new Date(now.getTime() - 7 * 86_400_000).toISOString()
  const cutoff14d = new Date(now.getTime() - 14 * 86_400_000).toISOString()
  const yesterday = new Date(now.getTime() - 86_400_000).toISOString()
  const twoDaysAgo = new Date(now.getTime() - 2 * 86_400_000).toISOString()

  for (const campaign of campaigns) {
    // Skip if election already passed
    if (campaign.election_date && new Date(campaign.election_date) < now) continue

    const daysToElection = campaign.election_date
      ? Math.ceil((new Date(campaign.election_date).getTime() - now.getTime()) / 86_400_000)
      : null

    const { data: runData } = await supabase
      .from('agent_runs')
      .insert({
        tenant_id: campaign.tenant_id,
        campaign_id: campaign.id,
        agent_id: AGENT_ID,
        workflow_id: WORKFLOW_ID,
        status: 'running',
        trigger: 'cron_daily_morning',
        steps: [],
      })
      .select()
      .single()

    const runId = runData?.id
    const steps: unknown[] = []

    try {
      // ── Current KPIs ──────────────────────────────────────────────────────────

      const { count: totalContacts } = await supabase
        .from('contacts').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)

      const { count: supporters } = await supabase
        .from('contacts').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id).eq('status', 'supporter')

      const { count: totalVisits } = await supabase
        .from('canvass_visits').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)

      const { count: visitsLast24h } = await supabase
        .from('canvass_visits').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id).gte('created_at', yesterday)

      const { count: newContactsToday } = await supabase
        .from('contacts').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id).gte('created_at', yesterday)

      // Active volunteers last 24h vs last 7d avg
      const { data: recentVolunteers } = await supabase
        .from('canvass_visits').select('volunteer_id')
        .eq('campaign_id', campaign.id).gte('created_at', yesterday)
      const activeVolunteersToday = new Set((recentVolunteers ?? []).map(v => v.volunteer_id)).size

      const { data: weeklyVolunteers } = await supabase
        .from('canvass_visits').select('volunteer_id')
        .eq('campaign_id', campaign.id).gte('created_at', cutoff7d)
      const activeVolunteers7d = new Set((weeklyVolunteers ?? []).map(v => v.volunteer_id)).size
      const avgDailyActiveVols = Math.round(activeVolunteers7d / 7)

      // ── Benchmark: compare yesterday vs day before ────────────────────────────
      const { count: visitsDayBefore } = await supabase
        .from('canvass_visits').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .gte('created_at', twoDaysAgo).lt('created_at', yesterday)

      const visitsDrop = visitsDayBefore && visitsDayBefore > 0
        ? Math.round(((visitsDayBefore - (visitsLast24h ?? 0)) / visitsDayBefore) * 100)
        : 0

      steps.push({ step: 'collect_kpis', completed_at: new Date().toISOString() })

      // ── Anomaly detection ─────────────────────────────────────────────────────
      const anomalies: string[] = []
      if (visitsDrop > 20) {
        anomalies.push(`Caída del ${visitsDrop}% en visitas de canvassing vs ayer`)
      }
      if (activeVolunteersToday < avgDailyActiveVols * 0.6 && avgDailyActiveVols > 0) {
        anomalies.push(`Voluntarios activos hoy (${activeVolunteersToday}) muy por debajo del promedio semanal (${avgDailyActiveVols}/día)`)
      }
      const supportRate = totalContacts ? Math.round(((supporters ?? 0) / totalContacts) * 100) : 0
      const coverageRate = totalContacts ? Math.round(((totalVisits ?? 0) / totalContacts) * 100) : 0

      // ── Generate report with Claude ───────────────────────────────────────────
      const prompt = `Genera el informe diario de situación para la campaña "${campaign.name}".

KPIs HOY (${today}):
- Contactos totales: ${totalContacts ?? 0} (+${newContactsToday ?? 0} nuevos hoy)
- Simpatizantes: ${supporters ?? 0} (${supportRate}% del total)
- Cobertura canvassing: ${coverageRate}% (${totalVisits ?? 0} visitas totales)
- Visitas ayer: ${visitsLast24h ?? 0} ${visitsDrop > 0 ? `(↓${visitsDrop}% vs día anterior)` : ''}
- Voluntarios activos ayer: ${activeVolunteersToday} (promedio semana: ${avgDailyActiveVols}/día)
${daysToElection !== null ? `- Días para la elección: ${daysToElection}` : ''}

ANOMALÍAS DETECTADAS:
${anomalies.length > 0 ? anomalies.map(a => `- ${a}`).join('\n') : '- Ninguna'}

Genera:
1. Un resumen ejecutivo conciso del estado de la campaña (2-3 líneas)
2. Las 2-3 acciones correctivas más prioritarias (solo si hay problemas reales)
3. Un nivel de alerta general: "verde" (todo bien), "amarillo" (atención requerida), o "rojo" (acción urgente)

Responde en JSON:
{
  "summary": "...",
  "alert_level": "verde|amarillo|rojo",
  "priority": "low|medium|high|critical",
  "corrective_actions": ["...", "..."],
  "estimated_impact": "..."
}`

      const response = await claude.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      let report: {
        summary: string
        alert_level: string
        priority: string
        corrective_actions: string[]
        estimated_impact: string
      }

      try {
        report = JSON.parse(text)
      } catch {
        report = {
          summary: `Campaña con ${totalContacts ?? 0} contactos, ${supportRate}% de simpatizantes y ${coverageRate}% de cobertura.`,
          alert_level: anomalies.length > 0 ? 'amarillo' : 'verde',
          priority: anomalies.length > 0 ? 'medium' : 'low',
          corrective_actions: [],
          estimated_impact: 'Monitoreo diario del estado general',
        }
      }

      steps.push({ step: 'generate_report', alert_level: report.alert_level, completed_at: new Date().toISOString() })

      // Dedup — only one daily report per day
      const { data: existing } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('type', `daily_report_${today}`)

      if (!existing?.length) {
        await supabase.from('ai_suggestions').insert({
          tenant_id: campaign.tenant_id,
          campaign_id: campaign.id,
          type: `daily_report_${today}`,
          module: 'analítica',
          priority: report.priority as 'critical' | 'high' | 'medium' | 'low',
          title: `Informe Diario — ${today} · Alerta: ${report.alert_level.toUpperCase()}`,
          description: report.summary,
          reasoning: anomalies.length > 0
            ? `Anomalías detectadas: ${anomalies.join('; ')}`
            : 'Monitoreo rutinario — sin anomalías',
          estimated_impact: report.estimated_impact,
          action_payload: {
            alert_level: report.alert_level,
            corrective_actions: report.corrective_actions,
            kpis: {
              totalContacts,
              supporters,
              supportRate,
              totalVisits,
              coverageRate,
              visitsLast24h,
              activeVolunteersToday,
              anomalies,
            },
            days_to_election: daysToElection,
          },
          agent_id: AGENT_ID,
          status: anomalies.length > 0 ? 'active' : 'active',
        })
        reportsCreated++
      }

      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          steps,
          result: { report, anomalies_count: anomalies.length, alert_level: report.alert_level },
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      await supabase
        .from('agent_runs')
        .update({ status: 'failed', steps, error: errMsg, completed_at: new Date().toISOString() })
        .eq('id', runId)
    }
  }

  return new Response(
    JSON.stringify({ processed: campaigns.length, reports_created: reportsCreated }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
