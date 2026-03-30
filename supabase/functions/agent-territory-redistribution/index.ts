import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAI, AiNotConfiguredError } from '../_shared/ai-router.ts'

// Agent 4 — Análisis de Terreno y Redistribución
// Trigger: nightly cron at 02:00 UTC OR manual HTTP POST with x-cron-secret
// HITL: ALL suggestions are pending_approval — coordinator must approve redistribution.
// Analyzes coverage per territory, detects low-coverage zones, and generates
// an optimal volunteer redistribution proposal.

const AGENT_ID = 'agent-territory-redistribution'
const WORKFLOW_ID = 'territory-redistribution-v1'

interface TerritoryMetric {
  id: string
  name: string
  visits: number
  contacts_in_zone: number
  coverage_pct: number
  priority: string
}

interface VolunteerActivity {
  volunteer_id: string
  full_name: string
  visit_count: number
  territory_id: string | null
}

Deno.serve(async (req: Request) => {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, tenant_id, name, election_date')
    .eq('is_active', true)

  if (!campaigns?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  let proposalsCreated = 0
  const now = new Date()
  const cutoff14d = new Date(now.getTime() - 14 * 86_400_000).toISOString()

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
        trigger: 'cron_nightly',
        steps: [],
      })
      .select()
      .single()

    const runId = runData?.id
    const steps: unknown[] = []

    try {
      // Step 1: Fetch territories with visit counts
      const { data: territories } = await supabase
        .from('territories')
        .select('id, name, priority')
        .eq('campaign_id', campaign.id)

      const territoryMetrics: TerritoryMetric[] = []

      for (const territory of territories ?? []) {
        const { count: visitCount } = await supabase
          .from('canvass_visits')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('territory_id', territory.id)

        const { count: contactsInZone } = await supabase
          .from('contacts')
          .select('id', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id)
          .eq('district', territory.name)

        const coverage = contactsInZone
          ? Math.round(((visitCount ?? 0) / contactsInZone) * 100)
          : 0

        territoryMetrics.push({
          id: territory.id,
          name: territory.name,
          visits: visitCount ?? 0,
          contacts_in_zone: contactsInZone ?? 0,
          coverage_pct: coverage,
          priority: territory.priority ?? 'normal',
        })
      }

      steps.push({ step: 'collect_territory_metrics', territories: territoryMetrics.length, completed_at: new Date().toISOString() })

      // Step 2: Fetch active volunteers with recent visit counts
      const { data: recentVisits } = await supabase
        .from('canvass_visits')
        .select('volunteer_id, territory_id')
        .eq('campaign_id', campaign.id)
        .gte('created_at', cutoff14d)

      const volunteerMap: Record<string, VolunteerActivity> = {}
      for (const v of recentVisits ?? []) {
        if (!v.volunteer_id) continue
        if (!volunteerMap[v.volunteer_id]) {
          volunteerMap[v.volunteer_id] = {
            volunteer_id: v.volunteer_id,
            full_name: '',
            visit_count: 0,
            territory_id: v.territory_id,
          }
        }
        volunteerMap[v.volunteer_id].visit_count++
      }

      // Enrich with names
      const volunteerIds = Object.keys(volunteerMap)
      if (volunteerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', volunteerIds)

        for (const p of profiles ?? []) {
          if (volunteerMap[p.id]) volunteerMap[p.id].full_name = p.full_name ?? p.id
        }
      }

      const volunteers = Object.values(volunteerMap).sort((a, b) => b.visit_count - a.visit_count)

      steps.push({ step: 'collect_volunteer_activity', volunteers: volunteers.length, completed_at: new Date().toISOString() })

      // Only generate proposal if there are meaningful coverage gaps
      const lowCoverage = territoryMetrics.filter(t => t.coverage_pct < 40 && t.contacts_in_zone > 0)
      const highCoverage = territoryMetrics.filter(t => t.coverage_pct > 70)

      if (lowCoverage.length === 0) {
        // No redistribution needed
        await supabase
          .from('agent_runs')
          .update({ status: 'completed', steps, result: { proposals: 0, reason: 'Coverage adequate' }, completed_at: new Date().toISOString() })
          .eq('id', runId)
        continue
      }

      // Step 3: Ask Claude to generate redistribution plan
      const lowSummary = lowCoverage.map(t =>
        `  - ${t.name}: ${t.coverage_pct}% cobertura (${t.visits} visitas / ${t.contacts_in_zone} contactos), prioridad: ${t.priority}`
      ).join('\n')

      const highSummary = highCoverage.map(t =>
        `  - ${t.name}: ${t.coverage_pct}% cobertura → posible fuente de voluntarios`
      ).join('\n') || '  - Ninguno'

      const volSummary = volunteers.slice(0, 8).map(v =>
        `  - ${v.full_name}: ${v.visit_count} visitas en 14 días`
      ).join('\n') || '  - Sin datos'

      const prompt = `Analiza la situación de canvassing de la campaña "${campaign.name}" y genera una propuesta de redistribución de voluntarios.

ZONAS CON BAJA COBERTURA (<40%):
${lowSummary}

ZONAS CON ALTA COBERTURA (posibles fuentes):
${highSummary}

VOLUNTARIOS ACTIVOS (últimos 14 días):
${volSummary}

${daysToElection !== null ? `DÍAS RESTANTES PARA LA ELECCIÓN: ${daysToElection}` : ''}

Genera UNA propuesta concreta de redistribución que maximice la cobertura total.
Responde en JSON con esta estructura exacta:
{
  "title": "...",
  "description": "...",
  "reasoning": "...",
  "estimated_impact": "...",
  "redistribution_plan": [
    {"from_territory": "...", "to_territory": "...", "volunteers": 0, "reason": "..."}
  ],
  "priority": "critical|high|medium"
}`

      const aiResult = await callAI(
        supabase,
        campaign.tenant_id,
        campaign.id,
        [{ role: 'user', content: prompt }],
        { maxTokens: 1200 },
      )

      const text = aiResult.content || '{}'
      let proposal: {
        title: string
        description: string
        reasoning: string
        estimated_impact: string
        redistribution_plan: unknown[]
        priority: string
      }

      try {
        proposal = JSON.parse(text)
      } catch {
        proposal = {
          title: `Redistribución recomendada — ${lowCoverage.length} zonas con baja cobertura`,
          description: `${lowCoverage.length} territorios tienen cobertura <40%. Se recomienda revisión de asignación de voluntarios.`,
          reasoning: 'Análisis automático de cobertura',
          estimated_impact: `Hasta +${lowCoverage.length * 15}% cobertura adicional`,
          redistribution_plan: [],
          priority: 'high',
        }
      }

      steps.push({ step: 'generate_proposal', completed_at: new Date().toISOString() })

      // Check for existing pending redistribution suggestion
      const { data: existing } = await supabase
        .from('ai_suggestions')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('type', 'territory_redistribution')
        .in('status', ['active', 'pending_approval'])

      if (!existing?.length) {
        await supabase.from('ai_suggestions').insert({
          tenant_id: campaign.tenant_id,
          campaign_id: campaign.id,
          type: 'territory_redistribution',
          module: 'canvassing',
          priority: proposal.priority as 'critical' | 'high' | 'medium' | 'low',
          title: proposal.title,
          description: proposal.description,
          reasoning: proposal.reasoning,
          estimated_impact: proposal.estimated_impact,
          action_payload: {
            redistribution_plan: proposal.redistribution_plan,
            low_coverage_territories: lowCoverage,
            days_to_election: daysToElection,
          },
          agent_id: AGENT_ID,
          status: 'pending_approval', // HITL always
        })
        proposalsCreated++
      }

      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          steps,
          result: { proposal, low_coverage_count: lowCoverage.length },
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
    JSON.stringify({ processed: campaigns.length, proposals_created: proposalsCreated }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
