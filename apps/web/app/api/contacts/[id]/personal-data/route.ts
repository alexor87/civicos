import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// ── GET — Export personal data ────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Load the contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, address, city, district, document_type, document_number, birth_date, gender, department, municipality, commune, voting_place, voting_table, status, tags, notes, created_at, updated_at, campaign_id')
    .eq('id', id)
    .single()

  if (error || !contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Authorization: super_admin can access any contact; others must own the campaign
  if (profile.role !== 'super_admin' && !profile.campaign_ids?.includes(contact.campaign_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Load visit history for this contact
  const { data: visits } = await supabase
    .from('canvass_visits')
    .select('id, created_at, result, status, notes')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  const payload = {
    exported_at: new Date().toISOString(),
    contact: {
      id:              contact.id,
      first_name:      contact.first_name,
      last_name:       contact.last_name,
      email:           contact.email,
      phone:           contact.phone,
      address:         contact.address,
      city:            contact.city,
      district:        contact.district,
      document_type:   contact.document_type,
      document_number: contact.document_number,
      birth_date:      contact.birth_date,
      gender:          contact.gender,
      department:      contact.department,
      municipality:    contact.municipality,
      commune:         contact.commune,
      voting_place:    contact.voting_place,
      voting_table:    contact.voting_table,
      status:          contact.status,
      tags:            contact.tags,
      notes:           contact.notes,
      created_at:      contact.created_at,
      updated_at:      contact.updated_at,
    },
    visits: (visits ?? []).map(v => ({
      id:         v.id,
      created_at: v.created_at,
      result:     v.result,
      status:     v.status,
      notes:      v.notes,
    })),
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="datos-personales-${id}.json"`,
    },
  })
}

// ── DELETE — Anonymize personal data ─────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only super_admin and campaign_manager can anonymize
  if (!['super_admin', 'campaign_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Load contact to verify campaign ownership
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, campaign_id, metadata')
    .eq('id', id)
    .single()

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (profile.role !== 'super_admin' && !profile.campaign_ids?.includes(contact.campaign_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const anonymizedAt = new Date().toISOString()
  const existingMeta = (contact.metadata as Record<string, unknown> | null) ?? {}

  const { error: updateError } = await supabase
    .from('contacts')
    .update({
      first_name:      'Datos',
      last_name:       'Eliminados',
      email:           null,
      phone:           null,
      address:         null,
      document_number: null,
      birth_date:      null,
      geo:             null,
      embedding:       null,
      notes:           null,
      metadata:        { ...existingMeta, gdpr_anonymized_at: anonymizedAt },
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to anonymize' }, { status: 500 })
  }

  return NextResponse.json({ success: true, anonymized_at: anonymizedAt })
}
