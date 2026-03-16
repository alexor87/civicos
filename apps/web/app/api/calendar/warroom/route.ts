import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EVENT_TYPE_CONFIG } from '@/components/dashboard/calendar/eventTypes'

// GET /api/calendar/warroom — aggregated data for the 4 war room quadrants
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_id: campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = (profile as { campaign_id?: string[] } | null)?.campaign_id?.[0]
  if (!campaignId) return NextResponse.json({ error: 'Sin campaña' }, { status: 400 })

  const now     = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()

  // Q1 + Q2: events in next 7 days
  const [upcomingRes, monthRes, contactsRes, visitsRes] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, event_type, status, start_at, end_at, location_text, municipality_name, intelligence_status, all_day')
      .eq('campaign_id', campaignId)
      .neq('status', 'cancelled')
      .gte('start_at', now.toISOString())
      .lte('start_at', in7Days.toISOString())
      .order('start_at', { ascending: true }),

    // Q4: month stats
    supabase
      .from('calendar_events')
      .select('id, status, event_type, start_at')
      .eq('campaign_id', campaignId)
      .gte('start_at', monthStart)
      .lt('start_at', monthEnd),

    // Q3: contacts for first upcoming event zone
    supabase
      .from('contacts')
      .select('id, sympathy_level, intention_vote')
      .eq('campaign_id', campaignId)
      .limit(500),

    // Q3: recent visits (last 14 days)
    supabase
      .from('visits')
      .select('id, result')
      .eq('campaign_id', campaignId)
      .gte('visited_at', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()),
  ])

  const upcoming = upcomingRes.data ?? []
  const monthEvents = monthRes.data ?? []

  // Q2: intelligence alerts = events with activatesIntelligence and NOT ready
  const intelligenceAlerts = upcoming.filter(e => {
    const cfg = EVENT_TYPE_CONFIG[e.event_type]
    return cfg?.activatesIntelligence && e.intelligence_status !== 'ready'
  })

  // Q3: field stats from contacts
  const contacts = contactsRes.data ?? []
  const total     = contacts.length
  const sympathizers = contacts.filter(c => (c.sympathy_level as number) >= 4).length
  const undecided    = contacts.filter(c => !c.intention_vote || c.intention_vote === 'undecided').length

  // Q4: month breakdown
  const completed = monthEvents.filter(e => e.status === 'completed').length
  const pending   = monthEvents.filter(e => e.status === 'confirmed').length
  const cancelled = monthEvents.filter(e => e.status === 'cancelled').length

  const nextElection = monthEvents
    .filter(e => e.event_type === 'electoral_date')
    .sort((a, b) => a.start_at.localeCompare(b.start_at))[0] ?? null

  return NextResponse.json({
    upcoming,
    intelligenceAlerts,
    field: {
      totalContacts:      total,
      sympathizersPct:    total > 0 ? Math.round((sympathizers / total) * 100) : 0,
      undecidedPct:       total > 0 ? Math.round((undecided / total) * 100) : 0,
      recentVisits:       visitsRes.data?.length ?? 0,
    },
    monthStats: {
      total:     monthEvents.length,
      completed,
      pending,
      cancelled,
      completedPct: monthEvents.length > 0 ? Math.round((completed / monthEvents.length) * 100) : 0,
      nextElection: nextElection?.start_at ?? null,
    },
  })
}
