import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contactFormSchema } from '@/lib/schemas/contact-form'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'no_campaign' }, { status: 400 })

  const body = await request.json()
  const parsed = contactFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data
  const phone = data.phone.replace(/\D/g, '')
  const email = data.email ? data.email.toLowerCase() : null

  // Deduplication: document number (only if provided)
  if (data.document_number) {
    const { data: existingByDoc } = await supabase
      .from('contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('document_number', data.document_number)
      .limit(1)
      .single()

    if (existingByDoc?.id) {
      return NextResponse.json(
        { error: 'duplicate', duplicateId: existingByDoc.id },
        { status: 409 }
      )
    }
  }

  // Secondary dedup: email or phone
  if (email || phone) {
    const orConditions: string[] = []
    if (email) orConditions.push(`email.eq.${email}`)
    if (phone) orConditions.push(`phone.eq.${phone}`)

    const { data: existingByContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .or(orConditions.join(','))
      .limit(1)
      .single()

    if (existingByContact?.id) {
      return NextResponse.json(
        { error: 'duplicate', duplicateId: existingByContact.id },
        { status: 409 }
      )
    }
  }

  // Build metadata from non-column fields
  const metadata: Record<string, unknown> = {}
  const metaFields = [
    'phone_alternate', 'marital_status', 'political_affinity',
    'vote_intention', 'preferred_party', 'electoral_priority',
    'campaign_role', 'contact_source', 'source_detail',
    'referred_by', 'mobilizes_count', 'main_need',
    'economic_sector', 'beneficiary_program',
  ] as const
  for (const field of metaFields) {
    const val = data[field as keyof typeof data]
    if (val !== undefined && val !== '' && val !== null) {
      metadata[field] = val
    }
  }

  // Tags
  const tags = data.tags
    ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
    : []

  const { data: inserted, error } = await supabase.from('contacts').insert({
    tenant_id: profile!.tenant_id,
    campaign_id: campaignId,
    first_name: data.first_name,
    last_name: data.last_name,
    document_type: data.document_type,
    document_number: data.document_number || null,
    phone,
    email,
    birth_date: data.birth_date || null,
    gender: data.gender || null,
    address: data.address || null,
    department: data.department || null,
    municipality: data.municipality || null,
    commune: data.commune || null,
    city: data.municipality || null,
    district: data.district_barrio || null,
    voting_place: data.voting_place || null,
    voting_table: data.voting_table || null,
    status: data.status || 'unknown',
    notes: data.notes || null,
    tags,
    metadata,
  }).select('id').single()

  if (error) {
    return NextResponse.json({ error: 'db_error', message: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: inserted!.id }, { status: 201 })
}
