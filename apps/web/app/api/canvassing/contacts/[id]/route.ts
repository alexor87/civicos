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

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, address, city, status, tags, document_number, department, municipality')
    .eq('id', id)
    .eq('campaign_id', campaignId)
    .single()

  if (contactError || !contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  const { data: lastVisit } = await supabase
    .from('canvass_visits')
    .select('id, result, notes, created_at, sympathy_level, vote_intention')
    .eq('contact_id', id)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ contact, lastVisit: lastVisit ?? null })
}
