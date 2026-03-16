import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { resolveThresholds } from '@/lib/agents/thresholds'
import { checkAgentRateLimit } from '@/lib/agent-rate-limit'

// Agent 4 — Territory Redistribution
// HITL: all proposals are pending_approval.
// Can be triggered manually from the AI Center or via nightly pg_cron.

const AGENT_ID = 'agent-territory-redistribution'

function isAuthorized(req: NextRequest): boolean {
  return req.headers.get('x-cron-secret') === (process.env.CRON_SECRET ?? '')
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
  const cutoff14d = new Date(now.getTime() - 14 * 86_400_000).toISOString()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, tenant_id, name, election_date, config')
    .eq('is_active', true)

  if (!campaigns?.length) return NextResponse.json({ processed: 0, proposals_created: 0 })

  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  let proposalsCreated = 0

  for (const campaign of campaigns) {
    if (campaign.election_date && new Date(campaign.election_date) < now) continue

    const daysToElection = campaign.election_date
      ? Math.ceil((new Date(campaign.election_date).getTime() - now.getTime()) / 86_400_000)
      : null

    const { data: runData } = await supabase
      .from('agent_runs')
      .insert({
        tenant_id: campaign.tenant_id, campaign_id: campaign.id,
        agent_id: AGENT_ID, workflow_id: 'territory-redistribution-v1',
        status: 'running', trigger: isCron ? 'cron_nightly' : 'manual_ui',
        steps: [],
      }).select().single()

    const runId = runData?.id
    const steps: unknown[] = []

    try {
      const { data: territories } = await supabase
        .from('territories').select('id, name, priority').eq('campaign_id', campaign.id)

      interface TerritoryMetric { id: string; name: string; visits: number; contacts_in_zone: number; coverage_pct: number; priority: string }
      const territoryMetrics: TerritoryMetric[] = []

      for (const t of territories ?? []) {
        const { count: visitCount } = await supabase
          .from('canvass_visits').select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id).eq('territory_id', t.id)

        const { count: contactsInZone } = await supabase
          .from('contacts').select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id).eq('district', t.name)

        const coverage = contactsInZone
          ? Math.round(((visitCount ?? 0) / contactsInZone) * 100) : 0

        territoryMetrics.push({
          id: t.id, name: t.name, visits: visitCount ?? 0,
          contacts_in_zone: contactsInZone ?? 0,
          coverage_pct: coverage, priority: t.priority ?? 'normal',
        })
      }

      const { data: recentVisits } = await supabase
        .from('canvass_visits').select('volunteer_id, territory_id')
        .eq('campaign_id', campaign.id).gte('created_at', cutoff14d)

      const volMap: Record<string, { visit_count: number; full_name: string }> = {}
      for (const v of recentVisits ?? []) {
        if (!v.volunteer_id) continue
        if (!volMap[v.volunteer_id]) volMap[v.volunteer_id] = { visit_count: 0, full_name: '' }
        volMap[v.volunteer_id].visit_count++
      }

      const volIds = Object.keys(volMap)
      if (volIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', volIds)
        for (const p of profiles ?? []) { if (volMap[p.id]) volMap[p.id].full_name = p.full_name ?? p.id }
      }

      steps.push({ step: 'collect_metrics', territories: territoryMetrics.length, completed_at: new Date().toISOString() })

      const thresholds = resolveThresholds((campaign as Record<string, unknown>).config)
      const lowCoverage = territoryMetrics.filter(t => t.coverage_pct < thresholds.coverage_low_pct && t.contacts_in_zone > 0)
      if (lowCoverage.length === 0) {
        await supabase.from('agent_runs').update({
          status: 'completed', steps,
          result: { proposals: 0, reason: 'Coverage adequate' }, completed_at: new Date().toISOString(),
        }).eq('id', runId)
        continue
      }

      const highCoverage = territoryMetrics.filter(t => t.coverage_pct > thresholds.coverage_low_pct * 1.75)
      const lowSummary = lowCoverage.map(t => `  - ${t.name}: ${t.coverage_pct}% (${t.visits}/${t.contacts_in_zone} contactos), prioridad: ${t.priority}`).join('\n')
      const highSummary = highCoverage.map(t => `  - ${t.name}: ${t.coverage_pct}%`).join('\n') || '  - Ninguno'
      const volSummary = Object.values(volMap).slice(0, 8).map(v => `  - ${v.full_name}: ${v.visit_count} visitas`).join('\n') || '  - Sin datos'

      const prompt = `Analiza la campaña "${campaign.name}" y genera una propuesta de redistribución de voluntarios.

ZONAS CON BAJA COBERTURA (<40%):
${lowSummary}

ZONAS CON ALTA COBERTURA (fuentes potenciales):
${highSummary}

VOLUNTARIOS ACTIVOS (14 días):
${volSummary}

${daysToElection !== null ? `DÍAS PARA LA ELECCIÓN: ${daysToElection}` : ''}

Genera UNA propuesta en JSON:
{"title":"...","description":"...","reasoning":"...","estimated_impact":"...","redistribution_plan":[{"from_territory":"...","to_territory":"...","volunteers":0,"reason":"..."}],"priority":"critical|high|medium"}`

      const response = await claude.messages.create({
        model: 'claude-sonnet-4-5', max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      let proposal: { title: string; description: string; reasoning: string; estimated_impact: string; redistribution_plan: unknown[]; priority: string }
      try { proposal = JSON.parse(text) }
      catch {
        proposal = {
          title: `Redistribución recomendada — ${lowCoverage.length} zonas con baja cobertura`,
          description: `${lowCoverage.length} territorios tienen cobertura <40%.`,
          reasoning: 'Análisis de cobertura automático', estimated_impact: `+${lowCoverage.length * 15}% cobertura`,
          redistribution_plan: [], priority: 'high',
        }
      }

      steps.push({ step: 'generate_proposal', completed_at: new Date().toISOString() })

      const { data: existing } = await supabase.from('ai_suggestions').select('id')
        .eq('campaign_id', campaign.id).eq('type', 'territory_redistribution').in('status', ['active', 'pending_approval'])

      if (!existing?.length) {
        await supabase.from('ai_suggestions').insert({
          tenant_id: campaign.tenant_id, campaign_id: campaign.id,
          type: 'territory_redistribution', module: 'canvassing',
          priority: proposal.priority as 'critical' | 'high' | 'medium' | 'low',
          title: proposal.title, description: proposal.description,
          reasoning: proposal.reasoning, estimated_impact: proposal.estimated_impact,
          action_payload: { redistribution_plan: proposal.redistribution_plan, low_coverage_territories: lowCoverage, days_to_election: daysToElection },
          agent_id: AGENT_ID, status: 'pending_approval',
        })
        proposalsCreated++
      }

      await supabase.from('agent_runs').update({
        status: 'completed', steps,
        result: { proposal, low_coverage_count: lowCoverage.length },
        completed_at: new Date().toISOString(),
      }).eq('id', runId)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      await supabase.from('agent_runs').update({ status: 'failed', steps, error: msg, completed_at: new Date().toISOString() }).eq('id', runId)
    }
  }

  return NextResponse.json({ processed: campaigns.length, proposals_created: proposalsCreated })
}
