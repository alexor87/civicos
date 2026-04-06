import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaignId = request.nextUrl.searchParams.get('campaignId')

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: visit, error } = await supabase
    .from('canvass_visits')
    .select('*, contacts(first_name, last_name), profiles!volunteer_id(full_name), territories(name)')
    .eq('contact_id', id)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !visit) {
    return NextResponse.json({ error: 'No visits found' }, { status: 404 })
  }

  return NextResponse.json(visit)
}
