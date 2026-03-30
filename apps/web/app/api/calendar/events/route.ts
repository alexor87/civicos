import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getCampaignId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, tenant_id')
    .eq('id', userId)
    .single()
  return { campaignId: profile?.campaign_ids?.[0] ?? null, tenantId: profile?.tenant_id ?? null }
}

// GET /api/calendar/events?month=YYYY-MM  OR  ?start=ISO&end=ISO
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { campaignId } = await getCampaignId(supabase, user.id)
  if (!campaignId) return NextResponse.json([])

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // YYYY-MM
  const start = searchParams.get('start') // ISO datetime
  const end   = searchParams.get('end')   // ISO datetime

  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('campaign_id', campaignId)
    .neq('status', 'cancelled')
    .order('start_at', { ascending: true })

  if (month) {
    const [year, mo] = month.split('-').map(Number)
    const rangeStart = new Date(year, mo - 1, 1).toISOString()
    const rangeEnd   = new Date(year, mo, 1).toISOString()
    query = query.gte('start_at', rangeStart).lt('start_at', rangeEnd)
  } else if (start && end) {
    query = query.gte('start_at', start).lt('start_at', end)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/calendar/events
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { campaignId, tenantId } = await getCampaignId(supabase, user.id)
  if (!campaignId || !tenantId) return NextResponse.json({ error: 'Sin campaña activa' }, { status: 400 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      tenant_id:          tenantId,
      campaign_id:        campaignId,
      created_by:         user.id,
      title:              body.title,
      event_type:         body.event_type ?? 'internal_meeting',
      status:             'confirmed',
      all_day:            body.all_day ?? false,
      start_at:           body.start_at,
      end_at:             body.end_at,
      location_text:      body.location_text ?? null,
      municipality_name:  body.municipality_name ?? null,
      municipality_code:  body.municipality_code ?? null,
      neighborhood_name:  body.neighborhood_name ?? null,
      description:        body.description ?? null,
      internal_notes:     body.internal_notes ?? null,
      expected_attendance: body.expected_attendance ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Save linked contacts as event participants
  const linkedContactIds: string[] = body.linked_contact_ids ?? []
  if (linkedContactIds.length > 0 && data) {
    const participants = linkedContactIds.map(contactId => ({
      tenant_id:  tenantId,
      event_id:   data.id,
      contact_id: contactId,
      role:       'attendee',
      status:     'confirmed',
    }))
    await supabase.from('event_participants').insert(participants)
  }

  return NextResponse.json(data, { status: 201 })
}
