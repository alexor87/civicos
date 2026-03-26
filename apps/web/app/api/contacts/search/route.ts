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

  // Search by name (first_name or last_name ilike)
  const searchTerm = `%${query}%`
  const { data } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, phone')
    .eq('campaign_id', campaignId)
    .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    .limit(5)

  return NextResponse.json({ results: data ?? [] })
}
