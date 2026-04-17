import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) return NextResponse.json({ contacts: [], territories: [] })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ contacts: [], territories: [] })

  const like = `%${q}%`

  const [contactsRes, territoriesRes] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone')
      .eq('campaign_id', campaignId)
      .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
      .is('deleted_at', null)
      .limit(5),
    supabase
      .from('territories')
      .select('id, name')
      .eq('campaign_id', campaignId)
      .ilike('name', like)
      .limit(4),
  ])

  return NextResponse.json({
    contacts:    contactsRes.data    ?? [],
    territories: territoriesRes.data ?? [],
  })
}
