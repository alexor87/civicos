import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const campaignId = searchParams.get('campaign_id')

  if (!query || !campaignId) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // C-2: verify campaign_id belongs to the authenticated user
  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  if (!profile?.campaign_ids?.includes(campaignId)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // I-4: sanitize query before interpolating into PostgREST filter
  const safeQuery = query.replace(/[%_\\]/g, '\\$&').replace(/[,()]/g, '').slice(0, 100)
  const searchTerm = `%${safeQuery}%`

  const { data } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, phone')
    .eq('campaign_id', campaignId)
    .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    .is('deleted_at', null)
    .limit(5)

  return NextResponse.json({ results: data ?? [] })
}
