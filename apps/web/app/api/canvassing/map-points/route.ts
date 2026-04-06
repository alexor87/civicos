import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export interface ClusteredPoint {
  cluster_id: string
  lat: number
  lng: number
  point_count: number
  contact_id: string | null
  dominant_status: string | null
  dominant_result: string | null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = request.nextUrl.searchParams
  const campaignId = sp.get('campaignId')
  const minLat = parseFloat(sp.get('minLat') ?? '')
  const minLng = parseFloat(sp.get('minLng') ?? '')
  const maxLat = parseFloat(sp.get('maxLat') ?? '')
  const maxLng = parseFloat(sp.get('maxLng') ?? '')
  const zoom = parseInt(sp.get('zoom') ?? '10')

  if (!campaignId || isNaN(minLat) || isNaN(minLng) || isNaN(maxLat) || isNaN(maxLng)) {
    return NextResponse.json({ error: 'Missing required params: campaignId, minLat, minLng, maxLat, maxLng' }, { status: 400 })
  }

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

  const { data, error } = await supabase.rpc('get_clustered_contacts', {
    p_campaign_id: campaignId,
    p_min_lat: minLat,
    p_min_lng: minLng,
    p_max_lat: maxLat,
    p_max_lng: maxLng,
    p_zoom: Math.max(1, Math.min(20, zoom)),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
