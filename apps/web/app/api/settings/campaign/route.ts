import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verify the user has permission to update this campaign
  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canEdit = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canEdit) {
    return NextResponse.json({ error: 'Sin permisos para editar la campaña' }, { status: 403 })
  }

  const body = await request.json()
  const {
    campaign_id,
    name,
    candidate_name,
    election_type,
    election_date,
    key_topics,
    description,
    brand_color,
    slogan,
    logo_url,
  } = body

  // Ensure the campaign belongs to this user
  if (!profile?.campaign_ids?.includes(campaign_id)) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  }

  const { error } = await supabase
    .from('campaigns')
    .update({
      name,
      candidate_name,
      election_type,
      election_date:  election_date || null,
      key_topics:     key_topics ?? [],
      description,
      brand_color,
      slogan:    slogan    ?? null,
      logo_url:  logo_url  ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaign_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
