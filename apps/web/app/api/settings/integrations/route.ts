import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canEdit = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canEdit) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const tenantId = profile!.tenant_id
  const campaignId = body.campaign_id ?? profile?.campaign_ids?.[0] ?? null

  if (campaignId && !profile?.campaign_ids?.includes(campaignId)) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  }

  const adminSupabase = createAdminClient()

  // Plain-text fields
  const plainFields = ['resend_domain', 'twilio_sid', 'twilio_from', 'twilio_whatsapp_from'] as const
  const updates: Record<string, unknown> = {}

  for (const key of plainFields) {
    if (key in body) updates[key] = body[key] || null
  }

  // Encrypt sensitive fields via DB function
  if ('resend_api_key' in body && body.resend_api_key) {
    const { data: encrypted } = await adminSupabase.rpc('encrypt_integration_key', { raw: body.resend_api_key })
    if (encrypted) {
      updates.resend_api_key = encrypted
      const key = body.resend_api_key as string
      updates.resend_api_key_hint = key.length > 4 ? `${key.slice(0, 4)}...${key.slice(-4)}` : '****'
    }
  } else if ('resend_api_key' in body) {
    updates.resend_api_key = null
    updates.resend_api_key_hint = null
  }

  if ('twilio_token' in body && body.twilio_token) {
    const { data: encrypted } = await adminSupabase.rpc('encrypt_integration_key', { raw: body.twilio_token })
    if (encrypted) {
      updates.twilio_token = encrypted
      const token = body.twilio_token as string
      updates.twilio_token_hint = token.length > 4 ? `${token.slice(0, 4)}...${token.slice(-4)}` : '****'
    }
  } else if ('twilio_token' in body) {
    updates.twilio_token = null
    updates.twilio_token_hint = null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  // Upsert into tenant_integrations
  let query = adminSupabase
    .from('tenant_integrations')
    .select('id')
    .eq('tenant_id', tenantId)

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  } else {
    query = query.is('campaign_id', null)
  }

  const { data: existing } = await query.single()

  if (existing) {
    const { error } = await adminSupabase
      .from('tenant_integrations')
      .update(updates)
      .eq('id', existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await adminSupabase
      .from('tenant_integrations')
      .insert({ tenant_id: tenantId, campaign_id: campaignId, ...updates })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
