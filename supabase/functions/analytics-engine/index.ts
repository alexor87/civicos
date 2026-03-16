import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.78.0'

// Analytics Engine — Motor Sugerencias IA v1
// Triggered by: pg_cron daily at 08:00 UTC (via net.http_post)
// Can also be invoked manually via: POST /functions/v1/analytics-engine
//   with header: x-cron-secret: <CRON_SECRET>

const AGENT_ID = 'analytics-engine-v1'

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

Deno.serve(async (req: Request) => {
  // Auth
  const secret = req.headers.get('x-cron-secret')
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const claude = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  // Fetch active campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, tenant_id, name')
    .eq('is_active', true)

  if (!campaigns?.length) {
    return new Response(JSON.stringify({ processed: 0, suggestions_created: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let suggestionsCreated = 0
  const now = new Date()

  for (const campaign of campaigns) {
    try {
      const cutoff30d = new Date(now.getTime() - 30 * 86_400_000).toISOString()
      const cutoff7d  = new Date(now.getTime() -  7 * 86_400_000).toISOString()
      const cutoff14d = new Date(now.getTime() - 14 * 86_400_000).toISOString()

      // ── Collect metrics ──────────────────────────────────────────────────────

      const { count: contacts_total = 0 } = await supabase
        .from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign.id)

      const { count: contacts_unvisited_30d = 0 } = await supabase
        .from('contacts').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .not('id', 'in', `(SELECT DISTINCT contact_id FROM canvass_visits WHERE created_at >= '${cutoff30d}')`)

      const { count: contacts_untagged_7d = 0 } = await supabase
        .from('contacts').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id).lte('created_at', cutoff7d).eq('tags', '{}')

      const { count: territories_no_visits = 0 } = await supabase
        .from('territories').select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .not('id', 'in', '(SELECT DISTINCT territory_id FROM canvass_visits WHERE territory_id IS NOT NULL)')

      // Stale draft campaigns
      const staleDrafts: { id: string; name: string; days_stale: number }[] = []
      for (const table of ['email_campaigns', 'sms_campaigns']) {
        const { data: drafts } = await supabase
          .from(table).select('id, name, created_at')
          .eq('campaign_id', campaign.id).eq('status', 'draft').lte('created_at', cutoff7d)
        if (drafts) {
          drafts.forEach(d => {
            const days = Math.floor((now.getTime() - new Date(d.created_at).getTime()) / 86_400_000)
            staleDrafts.push({ id: d.id, name: d.name, days_stale: days })
          })
        }
      }

      // Inactive volunteers
      const { data: allVolunteers = [] } = await supabase
        .from('profiles').select('id, full_name').eq('role', 'volunteer')
      const { data: recentVisitors = [] } = await supabase
        .from('canvass_visits').select('volunteer_id')
        .eq('campaign_id', campaign.id).gte('created_at', cutoff14d)
      const recentIds = new Set((recentVisitors ?? []).map((v: { volunteer_id: string }) => v.volunteer_id))
      const inactiveVols = (allVolunteers ?? []).filter((v: { id: string }) => !recentIds.has(v.id))

      // ── Build prompt ─────────────────────────────────────────────────────────

      const staleSummary = staleDrafts.length
        ? staleDrafts.map(d => `  - "${d.name}" lleva ${d.days_stale} días en borrador`).join('\n')
        : '  - Ninguna'
      const inactiveSummary = inactiveVols.length
        ? inactiveVols.slice(0, 5).map((v: { full_name: string }) => `  - ${v.full_name}`).join('\n')
        : '  - Ninguno'

      const prompt = `Analiza las métricas de la campaña "${campaign.name}" y genera sugerencias accionables.

MÉTRICAS:
- Contactos totales: ${contacts_total}
- Contactos sin visita en 30+ días: ${contacts_unvisited_30d}
- Contactos sin clasificar (7+ días, sin tags): ${contacts_untagged_7d}
- Territorios sin visitas: ${territories_no_visits}
- Campañas en borrador hace 7+ días:\n${staleSummary}
- Voluntarios inactivos 14+ días:\n${inactiveSummary}

REGLAS: Solo genera sugerencias para problemas reales. Máximo 4. Si todo está bien, devuelve [].
Responde ÚNICAMENTE con un array JSON (sin texto extra):
[{"type":"...","module":"crm|canvassing|communications|volunteers","priority":"critical|high|medium|low","title":"...","description":"...","reasoning":"...","estimated_impact":"...","action_payload":{}}]`

      const response = await claude.messages.create({
        model: 'claude-sonnet-4-5', max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
      let suggestions: AnalyticsSuggestion[] = []
      try { suggestions = JSON.parse(text); if (!Array.isArray(suggestions)) suggestions = [] }
      catch { suggestions = [] }

      // ── Dedup + insert ───────────────────────────────────────────────────────

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
    } catch (err) {
      console.error(`Error processing campaign ${campaign.id}:`, err)
    }
  }

  return new Response(
    JSON.stringify({ processed: campaigns.length, suggestions_created: suggestionsCreated }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
