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

  // Read pre-computed stats from campaign_stats (O(1) via trigger-maintained table)
  const { data: stats, error } = await supabase
    .from('campaign_stats')
    .select('total_contacts, supporters, total_visits, pending_visits')
    .eq('campaign_id', campaignId)
    .single()

  if (error || !stats) {
    // Fallback: campaign has no stats row yet (new campaign with 0 contacts)
    return NextResponse.json({
      totalContacts: 0,
      supporters: 0,
      pendingVisits: 0,
      totalVisits: 0,
      supportRate: 0,
      coverageRate: 0,
    })
  }

  const tc = stats.total_contacts ?? 0
  const s = stats.supporters ?? 0
  const tv = stats.total_visits ?? 0
  const pv = stats.pending_visits ?? 0

  return NextResponse.json({
    totalContacts: tc,
    supporters: s,
    pendingVisits: pv,
    totalVisits: tv,
    supportRate: tc ? Math.round((s / tc) * 100) : 0,
    coverageRate: tc ? Math.round((tv / tc) * 100) : 0,
  })
}
