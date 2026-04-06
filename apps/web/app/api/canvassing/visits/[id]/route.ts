import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify campaign ownership — IDOR fix
  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignIds: string[] = profile?.campaign_ids ?? []
  if (!campaignIds.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: visit, error } = await supabase
    .from('canvass_visits')
    .select('*, contacts(first_name, last_name), profiles!volunteer_id(full_name), territories(name)')
    .eq('id', id)
    .in('campaign_id', campaignIds)
    .single()

  if (error || !visit) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(visit)
}
