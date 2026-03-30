import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAI, AiNotConfiguredError } from '../_shared/ai-router.ts'

// Agent 3 — Comunicaciones Inteligentes
// Trigger: daily cron at 10:00 UTC OR manual HTTP POST with x-cron-secret header
// Analyzes email/SMS performance, suggests optimal send times,
// A/B variants, and re-engagement campaigns for inactive contacts.

const AGENT_ID = 'agent-smart-comms'
const WORKFLOW_ID = 'smart-comms-v1'

interface CommsSuggestion {
  type: string
  module: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  reasoning: string
  estimated_impact: string
  action_payload: Record<string, unknown>
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
    .select('id, tenant_id, name')
    .eq('is_active', true)

  if (!campaigns?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { 'Content-Type': 'application/json' } })
  }

  let suggestionsCreated = 0
  const now = new Date()
  const cutoff30d = new Date(now.getTime() - 30 * 86_400_000).toISOString()

  for (const campaign of campaigns) {
    const { data: runData } = await supabase
      .from('agent_runs')
      .insert({
        tenant_id: campaign.tenant_id,
        campaign_id: campaign.id,
        agent_id: AGENT_ID,
        workflow_id: WORKFLOW_ID,
        status: 'running',
        trigger: 'cron_daily',
        steps: [],
      })
      .select()
      .single()

    const runId = runData?.id
    const steps: unknown[] = []

    try {
      // Step 1: Fetch last 10 email campaigns with metrics
      const { data: emailCampaigns } = await supabase
        .from('email_campaigns')
        .select('id, name, status, sent_at, metrics')
        .eq('campaign_id', campaign.id)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(10)

      // Step 2: Fetch last 10 SMS campaigns
      const { data: smsCampaigns } = await supabase
        .from('sms_campaigns')
        .select('id, name, status, sent_at, sent_count, failed_count')
        .eq('campaign_id', campaign.id)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(10)

      // Step 3: Count contacts inactive 30+ days
      const { count: inactiveContacts } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .lt('last_contacted_at', cutoff30d)

      // Step 4: Fetch pending draft campaigns
      const { data: draftEmail } = await supabase
        .from('email_campaigns')
        .select('id, name, created_at')
        .eq('campaign_id', campaign.id)
        .eq('status', 'draft')

      const { data: draftSms } = await supabase
        .from('sms_campaigns')
        .select('id, name, created_at')
        .eq('campaign_id', campaign.id)
        .eq('status', 'draft')

      steps.push({ step: 'collect_metrics', completed_at: new Date().toISOString() })

      // Build metrics summary for Claude
      const emailMetricsSummary = (emailCampaigns ?? []).map(c => {
        const m = c.metrics as Record<string, number> | null
        const sentAt = c.sent_at ? new Date(c.sent_at) : null
        const hourSent = sentAt?.getHours() ?? 'unknown'
        const daySent = sentAt?.toLocaleDateString('es-ES', { weekday: 'long' }) ?? 'unknown'
        return `  - "${c.name}": ${m?.open_rate ?? 0}% apertura, ${m?.click_rate ?? 0}% clics | enviado ${daySent} a las ${hourSent}h`
      }).join('\n') || '  - Sin campañas enviadas'

      const smsSummary = (smsCampaigns ?? []).map(c => {
        const total = (c.sent_count ?? 0) + (c.failed_count ?? 0)
        const successRate = total > 0 ? Math.round(((c.sent_count ?? 0) / total) * 100) : 0
        return `  - "${c.name}": ${successRate}% entregados`
      }).join('\n') || '  - Sin SMS enviados'

      const draftsTotal = (draftEmail?.length ?? 0) + (draftSms?.length ?? 0)

      const prompt = `Analiza el rendimiento de comunicaciones de la campaña "${campaign.name}" y genera sugerencias inteligentes.

MÉTRICAS DE EMAIL (últimas 10 campañas):
${emailMetricsSummary}

MÉTRICAS DE SMS (últimas 10 campañas):
${smsSummary}

OTROS DATOS:
- Contactos sin interacción en 30+ días: ${inactiveContacts ?? 0}
- Borradores pendientes de enviar: ${draftsTotal}

Genera sugerencias accionables sobre:
1. Horario óptimo de envío (basado en tasas de apertura históricas)
2. Estrategia de re-engagement para contactos inactivos (si >50)
3. Alerta si hay borradores de más de 7 días sin enviar

Máximo 3 sugerencias. Solo incluye las que aporten valor real.
Responde ÚNICAMENTE con un array JSON:
[{"type":"...","module":"comunicaciones","priority":"critical|high|medium|low","title":"...","description":"...","reasoning":"...","estimated_impact":"...","action_payload":{}}]`

      const aiResult = await callAI(
        supabase,
        campaign.tenant_id,
        campaign.id,
        [{ role: 'user', content: prompt }],
        { maxTokens: 1500 },
      )

      const text = aiResult.content || '[]'
      let suggestions: CommsSuggestion[] = []
      try {
        suggestions = JSON.parse(text)
        if (!Array.isArray(suggestions)) suggestions = []
      } catch {
        suggestions = []
      }

      steps.push({ step: 'generate_suggestions', count: suggestions.length, completed_at: new Date().toISOString() })

      // Dedup and insert suggestions
      const { data: existing } = await supabase
        .from('ai_suggestions')
        .select('type')
        .eq('campaign_id', campaign.id)
        .in('status', ['active', 'pending_approval'])

      const existingTypes = new Set((existing ?? []).map((r: { type: string }) => r.type))

      for (const sug of suggestions) {
        if (existingTypes.has(sug.type)) continue
        const { error } = await supabase.from('ai_suggestions').insert({
          tenant_id: campaign.tenant_id,
          campaign_id: campaign.id,
          type: sug.type,
          module: sug.module,
          priority: sug.priority,
          title: sug.title,
          description: sug.description,
          reasoning: sug.reasoning,
          estimated_impact: sug.estimated_impact,
          action_payload: sug.action_payload,
          agent_id: AGENT_ID,
          status: 'active',
        })
        if (!error) suggestionsCreated++
      }

      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          steps,
          result: { suggestions_created: suggestionsCreated },
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
    JSON.stringify({ processed: campaigns.length, suggestions_created: suggestionsCreated }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
