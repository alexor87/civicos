import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canEdit = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canEdit) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { campaign_id } = body

  if (!profile?.campaign_ids?.includes(campaign_id)) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  }

  // Build update object dynamically — only include fields present in body
  const allowed = ['resend_domain', 'twilio_sid', 'twilio_token', 'twilio_from', 'twilio_whatsapp_from'] as const
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaign_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
