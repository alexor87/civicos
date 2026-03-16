import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'No active campaign' }, { status: 400 })

  const { data } = await supabase
    .from('whatsapp_chatbot_config')
    .select('*')
    .eq('campaign_id', campaignId)
    .single()

  return NextResponse.json(data ?? {
    enabled:          false,
    system_prompt:    '',
    fallback_message: 'No puedo responder esa pregunta en este momento.',
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canManage = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return NextResponse.json({ error: 'No active campaign' }, { status: 400 })

  const body = await req.json()
  const { enabled, system_prompt, fallback_message } = body as {
    enabled?: boolean
    system_prompt?: string
    fallback_message?: string
  }

  const { error } = await supabase
    .from('whatsapp_chatbot_config')
    .upsert({
      tenant_id:        profile!.tenant_id,
      campaign_id:      campaignId,
      enabled:          enabled ?? false,
      system_prompt:    system_prompt ?? '',
      fallback_message: fallback_message ?? 'No puedo responder esa pregunta en este momento.',
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'campaign_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
