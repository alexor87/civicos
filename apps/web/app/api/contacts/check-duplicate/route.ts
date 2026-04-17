import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const documentNumber = searchParams.get('document_number')
  const campaignId = searchParams.get('campaign_id')
  const excludeId = searchParams.get('exclude_id')
  const contactLevel = searchParams.get('contact_level') ?? 'completo'
  const firstName = searchParams.get('first_name')
  const lastName = searchParams.get('last_name')

  if (!campaignId) {
    return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })
  }

  // Anónimo contacts never have duplicates
  if (contactLevel === 'anonimo') {
    return NextResponse.json({ duplicate: false })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Opinion: dedup by name
  if (contactLevel === 'opinion') {
    if (!firstName || !lastName) {
      return NextResponse.json({ duplicate: false })
    }

    let query = supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('campaign_id', campaignId)
      .eq('contact_level', 'opinion')
      .ilike('first_name', firstName)
      .ilike('last_name', lastName)
      .is('deleted_at', null)
      .limit(1)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: existing } = await query.single()
    if (existing) {
      return NextResponse.json({ duplicate: true, contact: existing })
    }
    return NextResponse.json({ duplicate: false })
  }

  // Completo: dedup by document number
  if (!documentNumber) {
    return NextResponse.json(
      { error: 'document_number is required for completo contacts' },
      { status: 400 }
    )
  }

  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .eq('campaign_id', campaignId)
    .eq('document_number', documentNumber)
    .is('deleted_at', null)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data: existing } = await query.single()

  if (existing) {
    return NextResponse.json({ duplicate: true, contact: existing })
  }

  return NextResponse.json({ duplicate: false })
}
