import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { applyFilters } from '@/app/dashboard/contacts/segments/actions'
import type { SegmentFilter } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0] ?? ''
  const segmentId = request.nextUrl.searchParams.get('segmentId')
  const manualIds = request.nextUrl.searchParams.get('ids')

  // Manual selection: count by specific IDs
  if (manualIds) {
    const ids = manualIds.split(',').filter(Boolean)
    if (ids.length === 0) return NextResponse.json({ count: 0 })
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .in('id', ids)
      .not('email', 'is', null)
      .is('deleted_at', null)
    return NextResponse.json({ count: count ?? 0 })
  }

  if (!segmentId || segmentId === 'all') {
    // Count all contacts with email
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .not('email', 'is', null)
      .is('deleted_at', null)

    return NextResponse.json({ count: count ?? 0 })
  }

  // Count via segment filters
  const { data: segment } = await supabase
    .from('contact_segments')
    .select('filters')
    .eq('id', segmentId)
    .single()

  if (!segment) return NextResponse.json({ count: 0 })

  const result = await applyFilters(supabase, campaignId, segment.filters as SegmentFilter[])
  const filtered = (result.data ?? []).filter((c: any) => c.email)
  return NextResponse.json({ count: filtered.length })
}
