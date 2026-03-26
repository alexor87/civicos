import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json()
  if (!campaignId) return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  if (!profile?.campaign_ids?.includes(campaignId)) {
    return NextResponse.json({ error: 'Campaign not associated' }, { status: 403 })
  }

  const cookieStore = await cookies()
  cookieStore.set('active_campaign_id', campaignId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })

  return NextResponse.json({ ok: true })
}
