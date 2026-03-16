import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaignId = request.nextUrl.searchParams.get('campaignId')
  if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 })

  // Verify campaign ownership
  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignIds = profile?.campaign_ids as string[] | null
  if (!campaignIds?.includes(campaignId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [
    { count: totalContacts, error: e1 },
    { count: supporters, error: e2 },
    { count: pendingVisits, error: e3 },
    { count: totalVisits, error: e4 },
  ] = await Promise.all([
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId).eq('status', 'supporter'),
    supabase.from('canvass_visits').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId).is('approved_at', null),
    supabase.from('canvass_visits').select('*', { count: 'exact', head: true }).eq('campaign_id', campaignId),
  ])

  if (e1 || e2 || e3 || e4) {
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
  }

  const tc = totalContacts ?? 0
  const s = supporters ?? 0
  const tv = totalVisits ?? 0
  const pv = pendingVisits ?? 0

  return NextResponse.json({
    totalContacts: tc,
    supporters: s,
    pendingVisits: pv,
    totalVisits: tv,
    supportRate: tc ? Math.round((s / tc) * 100) : 0,
    coverageRate: tc ? Math.round((tv / tc) * 100) : 0,
  })
}
