import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getContactFormSchema, type ContactLevel } from '@/lib/schemas/contact-form'

const LEVEL_ORDER: Record<ContactLevel, number> = { anonimo: 0, opinion: 1, completo: 2 }
const VALID_LEVELS: ContactLevel[] = ['completo', 'opinion', 'anonimo']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'no_campaign' }, { status: 400 })

  // Fetch current contact to check existing level
  const { data: currentContact } = await supabase
    .from('contacts')
    .select('contact_level')
    .eq('id', id)
    .eq('campaign_id', campaignId)
    .is('deleted_at', null)
    .single()

  if (!currentContact) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const body = await request.json()
  const currentLevel = (currentContact.contact_level as ContactLevel) || 'completo'
  const requestedLevel: ContactLevel = VALID_LEVELS.includes(body.contact_level) ? body.contact_level : currentLevel

  // Prevent downgrade
  if (LEVEL_ORDER[requestedLevel] < LEVEL_ORDER[currentLevel]) {
    return NextResponse.json(
      { error: 'downgrade_not_allowed', message: 'No se puede bajar el nivel del contacto' },
      { status: 422 }
    )
  }

  const contactLevel = requestedLevel
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

  // Dedup: same doc number but different contact (only for completo)
  if (contactLevel === 'completo' && 'document_number' in data && data.document_number) {
    const { data: existingByDoc } = await supabase
      .from('contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('document_number', data.document_number)
      .neq('id', id)
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

  // Build metadata
  const metadata: Record<string, unknown> = {}
  const metaFields = [
    'phone_alternate', 'marital_status', 'political_affinity',
    'political_orientation', 'vote_intention', 'electoral_priority',
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

  const tagsRaw = 'tags' in data ? data.tags : undefined
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean)
    : []

  // Build update object
  const updateObj: Record<string, unknown> = {
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
    Object.assign(updateObj, {
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

  const { error } = await supabase.from('contacts').update(updateObj)
    .eq('id', id)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('[contacts/id] DB error:', error)
    return NextResponse.json({ error: 'Error interno. Inténtalo de nuevo.' }, { status: 500 })
  }

  // Update PostGIS geo column if coordinates are available
  const lat = 'location_lat' in data ? data.location_lat : null
  const lng = 'location_lng' in data ? data.location_lng : null
  const geoStatus = 'geocoding_status' in data ? data.geocoding_status : null
  if (lat && lng) {
    const rpc = geoStatus === 'manual_pin'
      ? 'update_contact_geo_manual'
      : 'update_contact_geo'
    await supabase.rpc(rpc, {
      p_contact_id: id,
      p_lat: lat,
      p_lng: lng,
    })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const campaignId = profile.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'no_campaign' }, { status: 400 })

  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('campaign_id', campaignId)

  if (error) {
    console.error('[contacts/id] DELETE error:', error)
    return NextResponse.json({ error: 'Error interno. Inténtalo de nuevo.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
