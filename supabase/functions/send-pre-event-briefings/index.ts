import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.78.0'

// Pre-event briefing generator
// Trigger: pg_cron every 30 minutes
// Finds events starting in 1-3 hours that need intelligence briefings
// Generates briefings via Claude and marks them ready

const EVENT_TYPES_WITH_INTELLIGENCE = [
  'public_event',
  'canvassing',
  'fundraising',
  'institutional_visit',
]

Deno.serve(async (req: Request) => {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  const now    = new Date()
  const in1h   = new Date(now.getTime() + 1 * 60 * 60 * 1000)
  const in3h   = new Date(now.getTime() + 3 * 60 * 60 * 1000)

  // Find events starting in 1-3 hours that need briefings
  const { data: events, error } = await supabase
    .from('calendar_events')
    .select('id, title, event_type, start_at, end_at, location_text, municipality_name, neighborhood_name, expected_attendance, campaign_id, intelligence_status, briefing_sent')
    .eq('status', 'confirmed')
    .in('event_type', EVENT_TYPES_WITH_INTELLIGENCE)
    .gte('start_at', in1h.toISOString())
    .lte('start_at', in3h.toISOString())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  let briefingsTriggered = 0
  let briefingsSent      = 0

  for (const event of events ?? []) {
    // Mark already-ready events as sent
    if (event.intelligence_status === 'ready' && !event.briefing_sent) {
      await supabase
        .from('calendar_events')
        .update({ briefing_sent: true })
        .eq('id', event.id)
      briefingsSent++
      continue
    }

    // Skip if already generating
    if (event.intelligence_status === 'generating') continue

    // Generate briefing for pending events
    if (event.intelligence_status === 'pending') {
      // Fetch zone CRM data
      let contactQuery = supabase
        .from('contacts')
        .select('id, sympathy_level, intention_vote')
        .eq('campaign_id', event.campaign_id)
      if (event.municipality_name) {
        contactQuery = contactQuery.ilike('municipality', `%${event.municipality_name}%`)
      }

      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const [{ data: contacts }, { data: visits }] = await Promise.all([
        contactQuery,
        supabase.from('visits').select('id, result').eq('campaign_id', event.campaign_id).gte('visited_at', thirtyDaysAgo),
      ])

      const totalContacts  = contacts?.length ?? 0
      const sympathizers   = contacts?.filter((c: { sympathy_level: number }) => c.sympathy_level >= 4).length ?? 0
      const undecided      = contacts?.filter((c: { intention_vote: string }) => !c.intention_vote || c.intention_vote === 'undecided').length ?? 0

      await supabase
        .from('calendar_events')
        .update({ intelligence_status: 'generating' })
        .eq('id', event.id)

      try {
        const prompt = `Eres el estratega político jefe de la campaña. Genera un briefing ejecutivo para el siguiente evento que comienza en las próximas 2 horas:

EVENTO: ${event.title}
TIPO: ${event.event_type}
FECHA: ${new Date(event.start_at).toLocaleString('es-CO')}
LUGAR: ${event.location_text ?? 'No especificado'}
MUNICIPIO: ${event.municipality_name ?? 'No especificado'}
BARRIO: ${event.neighborhood_name ?? 'No especificado'}
ASISTENCIA ESPERADA: ${event.expected_attendance ?? 'No especificada'}

DATOS CRM DE LA ZONA:
- Total contactos: ${totalContacts}
- Simpatizantes (nivel 4-5): ${sympathizers} (${totalContacts > 0 ? Math.round(sympathizers/totalContacts*100) : 0}%)
- Indecisos: ${undecided} (${totalContacts > 0 ? Math.round(undecided/totalContacts*100) : 0}%)
- Visitas de canvassing últimos 30 días: ${visits?.length ?? 0}

Genera un briefing JSON:
{
  "summary": "Resumen ejecutivo en 2-3 oraciones",
  "audience": "Perfil del público esperado",
  "risks": "Principales riesgos",
  "talking_points": ["Punto 1", "Punto 2", "Punto 3", "Punto 4", "Punto 5"],
  "logistics": "Recomendaciones logísticas"
}

Responde SOLO con el JSON.`

        const response = await anthropic.messages.create({
          model:      'claude-sonnet-4-5',
          max_tokens: 1024,
          messages:   [{ role: 'user', content: prompt }],
        })

        const text     = (response.content[0] as { type: string; text: string }).text.trim()
        const briefing = JSON.parse(text)

        await supabase
          .from('calendar_events')
          .update({
            ai_briefing:             briefing,
            intelligence_status:     'ready',
            intelligence_updated_at: now.toISOString(),
            briefing_sent:           true,
          })
          .eq('id', event.id)

        briefingsTriggered++
        briefingsSent++
      } catch {
        await supabase
          .from('calendar_events')
          .update({ intelligence_status: 'error' })
          .eq('id', event.id)
      }
    }
  }

  return new Response(
    JSON.stringify({
      processed:           events?.length ?? 0,
      briefings_triggered: briefingsTriggered,
      briefings_sent:      briefingsSent,
      checked_at:          now.toISOString(),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
