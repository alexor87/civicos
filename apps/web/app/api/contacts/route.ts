import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getContactFormSchema, type ContactLevel } from '@/lib/schemas/contact-form'
import { rejectIfImpersonating } from '@/lib/impersonation-guard'

const VALID_LEVELS: ContactLevel[] = ['completo', 'opinion', 'anonimo']

export async function POST(request: Request) {
  const impersonationError = await rejectIfImpersonating()
  if (impersonationError) return impersonationError

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
  const contactLevel: ContactLevel = VALID_LEVELS.includes(body.contact_level) ? body.contact_level : 'completo'

  const schema = getContactFormSchema(contactLevel)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  const data = parsed.data
  const phone = 'phone' in data && data.phone ? data.phone.replace(/\D/g, '') : null
  const email = 'email' in data && data.email ? data.email.toLowerCase() : null

  // ── Deduplication per level ──
  if (contactLevel === 'completo') {
    // Dedup by document number
    if ('document_number' in data && data.document_number) {
      const { data: existingByDoc } = await supabase
        .from('contacts')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('document_number', data.document_number)
        .is('deleted_at', null)
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
        .is('deleted_at', null)
        .limit(1)
        .single()

      if (existingByContact?.id) {
        return NextResponse.json(
          { error: 'duplicate', duplicateId: existingByContact.id },
          { status: 409 }
        )
      }
    }
  } else if (contactLevel === 'opinion') {
    // Dedup by name
    const firstName = 'first_name' in data ? data.first_name : ''
    const lastName = 'last_name' in data ? data.last_name : ''
    if (firstName && lastName) {
      const { data: existingByName } = await supabase
        .from('contacts')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('contact_level', 'opinion')
        .ilike('first_name', firstName)
        .ilike('last_name', lastName)
        .is('deleted_at', null)
        .limit(1)
        .single()

      if (existingByName?.id) {
        return NextResponse.json(
          { error: 'duplicate', duplicateId: existingByName.id },
          { status: 409 }
        )
      }
    }
  }
  // anonimo: no dedup

  // Build metadata from non-column fields
  const metadata: Record<string, unknown> = {}
  const metaFields = [
    'phone_alternate', 'marital_status', 'political_affinity',
    'political_orientation', 'vote_intention', 'electoral_priority',
    'campaign_role', 'contact_source', 'source_detail',
    'referred_by', 'mobilizes_count', 'main_need',
    'economic_sector', 'beneficiary_program',
    'sector',
  ] as const
  for (const field of metaFields) {
    const val = data[field as keyof typeof data]
    if (val !== undefined && val !== '' && val !== null) {
      metadata[field] = val
    }
  }

  // Tags
  const tagsRaw = 'tags' in data ? data.tags : undefined
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean)
    : []

  // Build insert object — anónimo contacts omit personal fields
  const insertObj: Record<string, unknown> = {
    tenant_id: profile!.tenant_id,
    campaign_id: campaignId,
    contact_level: contactLevel,
    status: ('status' in data ? data.status : null) || 'unknown',
    notes: ('notes' in data ? data.notes : null) || null,
    tags,
    metadata,
    department: ('department' in data ? data.department : null) || null,
    municipality: ('municipality' in data ? data.municipality : null) || null,
    commune: ('commune' in data ? data.commune : null) || null,
    city: ('municipality' in data ? data.municipality : null) || null,
    district: ('district_barrio' in data ? data.district_barrio : null) || null,
  }

  if (contactLevel !== 'anonimo') {
    Object.assign(insertObj, {
      first_name: 'first_name' in data ? data.first_name : null,
      last_name: 'last_name' in data ? data.last_name : null,
      document_type: ('document_type' in data ? data.document_type : null) || null,
      document_number: ('document_number' in data ? data.document_number : null) || null,
      phone,
      email,
      birth_date: ('birth_date' in data ? data.birth_date : null) || null,
      gender: ('gender' in data ? data.gender : null) || null,
      address: ('address' in data ? data.address : null) || null,
      voting_place: ('voting_place' in data ? data.voting_place : null) || null,
      voting_table: ('voting_table' in data ? data.voting_table : null) || null,
      location_lat: ('location_lat' in data ? data.location_lat : null) ?? null,
      location_lng: ('location_lng' in data ? data.location_lng : null) ?? null,
      geocoding_status: ('geocoding_status' in data ? data.geocoding_status : null) || 'pending',
    })
  }

  const { data: inserted, error } = await supabase.from('contacts')
    .insert(insertObj)
    .select('id')
    .single()

  if (error) {
    console.error('[contacts] DB error:', JSON.stringify(error))
    console.error('[contacts] insertObj:', JSON.stringify(insertObj))
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'duplicate', message: 'Ya existe un contacto con estos datos' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Error interno', code: error.code },
      { status: 500 }
    )
  }

  // Update PostGIS geo column if coordinates are available
  const lat = 'location_lat' in data ? data.location_lat : null
  const lng = 'location_lng' in data ? data.location_lng : null
  const geoStatus = 'geocoding_status' in data ? data.geocoding_status : null
  if (lat && lng && inserted?.id) {
    const rpc = geoStatus === 'manual_pin'
      ? 'update_contact_geo_manual'
      : 'update_contact_geo'
    await supabase.rpc(rpc, {
      p_contact_id: inserted.id,
      p_lat: lat,
      p_lng: lng,
    })
  }

  return NextResponse.json({ id: inserted!.id }, { status: 201 })
}
