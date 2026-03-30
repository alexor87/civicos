import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'

// GET /api/calendar/events/[id]/intelligence — CRM data for the event zone
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: event } = await supabase
    .from('calendar_events')
    .select('id, campaign_id, municipality_name, neighborhood_name, ai_briefing, intelligence_status, intelligence_updated_at')
    .eq('id', id)
    .single()

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  // Fetch linked contact IDs, then fetch contact details separately
  const { data: linkedParticipants } = await supabase
    .from('event_participants')
    .select('contact_id')
    .eq('event_id', id)
    .not('contact_id', 'is', null)

  const linkedContactIds = (linkedParticipants ?? []).map((p: any) => p.contact_id).filter(Boolean)
  let linkedContacts: any[] = []
  if (linkedContactIds.length > 0) {
    const { data: lc } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, sympathy_level, intention_vote, municipality, phone, email, status')
      .in('id', linkedContactIds)
    linkedContacts = lc ?? []
  }

  // Build contact filter based on available location fields
  let contactQuery = supabase
    .from('contacts')
    .select('id, sympathy_level, intention_vote')
    .eq('campaign_id', event.campaign_id)

  if (event.municipality_name) {
    contactQuery = contactQuery.ilike('municipality', `%${event.municipality_name}%`)
  }

  // Canvassing visits in the zone (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  let visitsQuery = supabase
    .from('canvass_visits')
    .select('id, result')
    .eq('campaign_id', event.campaign_id)
    .gte('created_at', thirtyDaysAgo)

  const [{ data: contacts }, { data: visits }] = await Promise.all([
    contactQuery,
    visitsQuery,
  ])

  // Aggregate contact sympathy distribution
  const sympathyDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let undecided = 0
  for (const c of contacts ?? []) {
    const lvl = c.sympathy_level as number | null
    if (lvl && lvl >= 1 && lvl <= 5) sympathyDist[lvl]++
    if (c.intention_vote === 'undecided' || !c.intention_vote) undecided++
  }

  // Visit result frequency
  const resultFreq: Record<string, number> = {}
  for (const v of visits ?? []) {
    const r = (v.result as string) ?? 'unknown'
    resultFreq[r] = (resultFreq[r] ?? 0) + 1
  }
  const mostFrequentResult = Object.entries(resultFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const totalContacts = contacts?.length ?? 0

  return NextResponse.json({
    contacts: {
      total:          totalContacts,
      sympathyDist,
      undecidedCount: undecided,
      undecidedPct:   totalContacts > 0 ? Math.round((undecided / totalContacts) * 100) : 0,
    },
    linkedContacts: linkedContacts.map((c: any) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      sympathy_level: c.sympathy_level,
      status: c.status,
      phone: c.phone,
      email: c.email,
    })),
    canvassing: {
      totalVisits:         visits?.length ?? 0,
      mostFrequentResult,
      resultBreakdown:     resultFreq,
    },
    aiStatus:   event.intelligence_status,
    aiBriefing: event.ai_briefing ?? null,
    cached_at:  event.intelligence_updated_at ?? null,
  })
}

// POST /api/calendar/events/[id]/intelligence — generate AI briefing
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: event } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!event) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Mark as generating
  await supabase
    .from('calendar_events')
    .update({ intelligence_status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', eventId)

  // Fetch linked contact IDs, then fetch contact details separately
  const { data: briefingParticipants } = await supabase
    .from('event_participants')
    .select('contact_id')
    .eq('event_id', eventId)
    .not('contact_id', 'is', null)

  const briefingContactIds = (briefingParticipants ?? []).map((p: any) => p.contact_id).filter(Boolean)
  let briefingLinkedContacts: any[] = []
  if (briefingContactIds.length > 0) {
    const { data: blc } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, sympathy_level, intention_vote, municipality, phone, email, status, notes')
      .in('id', briefingContactIds)
    briefingLinkedContacts = blc ?? []
  }

  // Fetch CRM data for the zone
  let contactQuery = supabase
    .from('contacts')
    .select('id, sympathy_level, intention_vote, neighborhood')
    .eq('campaign_id', event.campaign_id)
  if (event.municipality_name) {
    contactQuery = contactQuery.ilike('municipality', `%${event.municipality_name}%`)
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const [{ data: contacts }, { data: visits }] = await Promise.all([
    contactQuery,
    supabase.from('canvass_visits').select('id, result').eq('campaign_id', event.campaign_id).gte('created_at', thirtyDaysAgo),
  ])

  const totalContacts = contacts?.length ?? 0
  const sympathizers   = contacts?.filter(c => (c.sympathy_level as number) >= 4).length ?? 0
  const undecided      = contacts?.filter(c => c.intention_vote === 'undecided' || !c.intention_vote).length ?? 0

  // Build linked contacts info for the prompt
  const linkedContactsInfo = briefingLinkedContacts.length > 0
    ? `\nCONTACTOS VINCULADOS AL EVENTO:\n${briefingLinkedContacts.map((c: any, i: number) =>
        `${i + 1}. ${c.first_name} ${c.last_name}` +
        (c.status ? ` — Estado: ${c.status}` : '') +
        (c.sympathy_level ? ` — Nivel simpatía: ${c.sympathy_level}/5` : '') +
        (c.intention_vote ? ` — Intención voto: ${c.intention_vote}` : '') +
        (c.municipality ? ` — Municipio: ${c.municipality}` : '') +
        (c.notes ? ` — Notas: ${c.notes}` : '')
      ).join('\n')}\n`
    : ''

  const prompt = `Eres el estratega político jefe de la campaña. Genera un briefing ejecutivo para el siguiente evento:

EVENTO: ${event.title}
TIPO: ${event.event_type}
FECHA: ${new Date(event.start_at).toLocaleString('es-CO')}
LUGAR: ${event.location_text ?? 'No especificado'}
MUNICIPIO: ${event.municipality_name ?? 'No especificado'}
BARRIO/SECTOR: ${event.neighborhood_name ?? 'No especificado'}
ASISTENCIA ESPERADA: ${event.expected_attendance ?? 'No especificada'}

DATOS CRM DE LA ZONA:
- Total contactos en la zona: ${totalContacts}
- Simpatizantes (nivel 4-5): ${sympathizers} (${totalContacts > 0 ? Math.round(sympathizers/totalContacts*100) : 0}%)
- Indecisos: ${undecided} (${totalContacts > 0 ? Math.round(undecided/totalContacts*100) : 0}%)
- Visitas de canvassing últimos 30 días: ${visits?.length ?? 0}
${linkedContactsInfo}
Genera un briefing JSON con exactamente esta estructura:
{
  "summary": "Resumen ejecutivo en 2-3 oraciones del contexto y oportunidad",
  "audience": "Perfil del público esperado y datos clave del CRM",
  "risks": "Principales riesgos y puntos de atención",
  "talking_points": ["Punto de conversación 1", "Punto 2", "Punto 3", "Punto 4", "Punto 5"],
  "logistics": "Recomendaciones logísticas y operativas específicas"
}

Responde SOLO con el JSON, sin texto adicional.`

  try {
    const adminSupabase = createAdminClient()
    const aiResult = await callAI(adminSupabase, profile.tenant_id, event.campaign_id, [
      { role: 'user', content: prompt },
    ], { maxTokens: 1024 })

    const text = (aiResult.content || '').trim()
    const briefing = JSON.parse(text)

    await supabase
      .from('calendar_events')
      .update({
        ai_briefing:            briefing,
        intelligence_status:    'ready',
        intelligence_updated_at: new Date().toISOString(),
        updated_at:             new Date().toISOString(),
      })
      .eq('id', eventId)

    return NextResponse.json({ briefing, status: 'ready' })
  } catch (err) {
    await supabase
      .from('calendar_events')
      .update({ intelligence_status: 'error', updated_at: new Date().toISOString() })
      .eq('id', eventId)

    return NextResponse.json({ error: 'Error generando briefing' }, { status: 500 })
  }
}
