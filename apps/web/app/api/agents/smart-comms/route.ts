import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'
import { resolveThresholds } from '@/lib/agents/thresholds'
import { checkAgentRateLimit } from '@/lib/agent-rate-limit'

// Agent 3 — Smart Communications
// Can be triggered manually from the AI Center UI (Campaign Manager+)
// or via pg_cron (agent-smart-comms edge function mirrors this logic).

const AGENT_ID = 'agent-smart-comms'

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get('x-cron-secret')
  return secret === (process.env.CRON_SECRET ?? '')
}

async function requireManagerAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()
  if (!profile) return null
  const allowedRoles = ['super_admin', 'campaign_manager']
  if (!allowedRoles.includes(profile.role)) return null
  return profile
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Allow cron secret OR authenticated campaign manager
  const isCron = isAuthorized(req)
  if (!isCron) {
    const profile = await requireManagerAuth(supabase)
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkAgentRateLimit(profile.tenant_id, AGENT_ID)
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

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, tenant_id, name, config')
    .eq('is_active', true)

  if (!campaigns?.length) {
    return NextResponse.json({ processed: 0, suggestions_created: 0 })
  }

  const adminSupabase = createAdminClient()
  let suggestionsCreated = 0

  for (const campaign of campaigns) {
    const { data: runData } = await supabase
      .from('agent_runs')
      .insert({
        tenant_id: campaign.tenant_id,
        campaign_id: campaign.id,
        agent_id: AGENT_ID,
        workflow_id: 'smart-comms-v1',
        status: 'running',
        trigger: isCron ? 'cron_daily' : 'manual_ui',
        steps: [],
      })
      .select().single()

    const runId = runData?.id
    const steps: unknown[] = []
    const thresholds = resolveThresholds((campaign as Record<string, unknown>).config)
    const cutoff30d = new Date(now.getTime() - thresholds.inactive_contact_days * 86_400_000).toISOString()
    const cutoff7d  = new Date(now.getTime() - thresholds.stale_draft_days * 86_400_000).toISOString()

    try {
      const { data: emailCampaigns } = await supabase
        .from('email_campaigns')
        .select('name, sent_at, metrics')
        .eq('campaign_id', campaign.id).eq('status', 'sent')
        .order('sent_at', { ascending: false }).limit(10)

      const { data: smsCampaigns } = await supabase
        .from('sms_campaigns')
        .select('name, sent_at, sent_count, failed_count')
        .eq('campaign_id', campaign.id).eq('status', 'sent')
        .order('sent_at', { ascending: false }).limit(10)

      const { count: inactiveContacts } = await supabase
        .from('contacts').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .lt('last_contacted_at', cutoff30d)

      const { data: draftEmail } = await supabase
        .from('email_campaigns').select('id').eq('campaign_id', campaign.id).eq('status', 'draft').lte('created_at', cutoff7d)
      const { data: draftSms } = await supabase
        .from('sms_campaigns').select('id').eq('campaign_id', campaign.id).eq('status', 'draft').lte('created_at', cutoff7d)

      const emailMetricsSummary = (emailCampaigns ?? []).map(c => {
        const m = c.metrics as Record<string, number> | null
        const sentAt = c.sent_at ? new Date(c.sent_at) : null
        const hour = sentAt?.getHours() ?? 'n/a'
        const day = sentAt?.toLocaleDateString('es-ES', { weekday: 'long' }) ?? 'n/a'
        return `  - "${c.name}": ${m?.open_rate ?? 0}% apertura | ${day} ${hour}h`
      }).join('\n') || '  - Sin campañas enviadas'

      const smsSummary = (smsCampaigns ?? []).map(c => {
        const total = (c.sent_count ?? 0) + (c.failed_count ?? 0)
        const rate = total > 0 ? Math.round(((c.sent_count ?? 0) / total) * 100) : 0
        return `  - "${c.name}": ${rate}% entregados`
      }).join('\n') || '  - Sin SMS enviados'

      const draftsTotal = (draftEmail?.length ?? 0) + (draftSms?.length ?? 0)

      steps.push({ step: 'collect_metrics', completed_at: new Date().toISOString() })

      const prompt = `Analiza el rendimiento de comunicaciones de la campaña "${campaign.name}" y genera sugerencias.

EMAIL (últimas 10 campañas):
${emailMetricsSummary}

SMS (últimas 10 campañas):
${smsSummary}

- Contactos sin interacción en 30+ días: ${inactiveContacts ?? 0}
- Borradores pendientes (+7 días): ${draftsTotal}

Genera hasta 3 sugerencias. Responde SOLO con array JSON:
[{"type":"...","module":"comunicaciones","priority":"critical|high|medium|low","title":"...","description":"...","reasoning":"...","estimated_impact":"...","action_payload":{}}]`

      const aiResult = await callAI(adminSupabase, campaign.tenant_id, campaign.id, [
        { role: 'user', content: prompt },
      ], { maxTokens: 1200 })

      const text = aiResult.content || '[]'
      let suggestions: { type: string; module: string; priority: string; title: string; description: string; reasoning: string; estimated_impact: string; action_payload: Record<string, unknown> }[] = []
      try { suggestions = JSON.parse(text); if (!Array.isArray(suggestions)) suggestions = [] } catch { suggestions = [] }

      steps.push({ step: 'generate', count: suggestions.length, completed_at: new Date().toISOString() })

      const { data: existing } = await supabase
        .from('ai_suggestions').select('type')
        .eq('campaign_id', campaign.id).in('status', ['active', 'pending_approval'])
      const existingTypes = new Set((existing ?? []).map((r: { type: string }) => r.type))

      for (const sug of suggestions) {
        if (existingTypes.has(sug.type)) continue
        const { error } = await supabase.from('ai_suggestions').insert({
          tenant_id: campaign.tenant_id, campaign_id: campaign.id,
          type: sug.type, module: sug.module, priority: sug.priority,
          title: sug.title, description: sug.description,
          reasoning: sug.reasoning, estimated_impact: sug.estimated_impact,
          action_payload: sug.action_payload,
          agent_id: AGENT_ID, status: 'active',
        })
        if (!error) suggestionsCreated++
      }

      await supabase.from('agent_runs').update({
        status: 'completed', steps,
        result: { suggestions_created: suggestionsCreated },
        completed_at: new Date().toISOString(),
      }).eq('id', runId)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      await supabase.from('agent_runs').update({
        status: 'failed', steps, error: msg, completed_at: new Date().toISOString(),
      }).eq('id', runId)
    }
  }

  return NextResponse.json({ processed: campaigns.length, suggestions_created: suggestionsCreated })
}
