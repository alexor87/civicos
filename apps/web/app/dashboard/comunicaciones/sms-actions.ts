'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMessagingProvider } from '@/lib/messaging/dispatcher'
import { MessagingConfigError } from '@/lib/messaging/types'
import { applyFilters } from '@/app/dashboard/contacts/segments/actions'
import type { SegmentFilter } from '@/lib/types/database'

// ── createSmsCampaign ─────────────────────────────────────────────────────────

export async function createSmsCampaign(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canManage = ['super_admin', 'campaign_manager', 'analyst'].includes(profile?.role ?? '')
  if (!canManage) return

  const name       = (formData.get('name') as string)?.trim()
  const body_text  = (formData.get('body_text') as string)?.trim()
  const segment_id = (formData.get('segment_id') as string) || null

  if (!name || !body_text) return

  const { data, error } = await supabase
    .from('sms_campaigns')
    .insert({
      tenant_id:       profile?.tenant_id,
      campaign_id:     profile?.campaign_ids?.[0] ?? null,
      name,
      body_text,
      segment_id:      segment_id || null,
      status:          'draft',
      recipient_count: 0,
      created_by:      user.id,
    })
    .select('id')
    .single()

  if (error || !data) return

  redirect(`/dashboard/comunicaciones/sms/${data.id}`)
}

// ── updateSmsCampaign ─────────────────────────────────────────────────────────

export async function updateSmsCampaign(campaignId: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const canManage = ['super_admin', 'campaign_manager', 'analyst'].includes(profile?.role ?? '')
  if (!canManage) return

  const name       = (formData.get('name') as string)?.trim()
  const body_text  = (formData.get('body_text') as string)?.trim()
  const segment_id = (formData.get('segment_id') as string) || null

  if (!name || !body_text) return

  const { error } = await supabase
    .from('sms_campaigns')
    .update({ name, body_text, segment_id: segment_id || null })
    .eq('id', campaignId)
    .eq('status', 'draft')

  if (error) return

  redirect(`/dashboard/comunicaciones/sms/${campaignId}`)
}

// ── sendSmsCampaign ───────────────────────────────────────────────────────────

export async function sendSmsCampaign(campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canSend = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canSend) return { error: 'No tienes permiso para enviar campañas SMS' }

  const { data: smsCampaign } = await supabase
    .from('sms_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!smsCampaign) return { error: 'Campaña SMS no encontrada' }
  if (smsCampaign.status === 'sent') return { error: 'Esta campaña SMS ya fue enviada' }

  const activeCampaignId = profile?.campaign_ids?.[0] ?? ''

  let provider
  try {
    provider = await getMessagingProvider(
      supabase,
      createAdminClient(),
      profile!.tenant_id,
      activeCampaignId || null,
      'sms'
    )
  } catch (err) {
    if (err instanceof MessagingConfigError) return { error: err.message }
    throw err
  }

  let contacts: { id: string; phone: string | null; first_name: string; last_name: string }[] = []

  if (smsCampaign.segment_id) {
    const { data: segment } = await supabase
      .from('contact_segments')
      .select('filters')
      .eq('id', smsCampaign.segment_id)
      .single()

    if (segment?.filters) {
      const result = await applyFilters(supabase, activeCampaignId, segment.filters as SegmentFilter[])
      contacts = (result.data ?? []) as typeof contacts
    }
  } else {
    const { data } = await supabase
      .from('contacts')
      .select('id, phone, first_name, last_name')
      .eq('campaign_id', activeCampaignId)
      .is('deleted_at', null)
      .not('phone', 'is', null)
    contacts = (data ?? []) as typeof contacts
  }

  const recipients = contacts.filter(c => c.phone)

  if (recipients.length === 0) {
    return { error: 'No hay destinatarios con teléfono en este segmento' }
  }

  let sent = 0
  let failed = 0

  for (const contact of recipients) {
    const personalizedBody = smsCampaign.body_text
      .replace(/\{nombre\}/gi,  contact.first_name ?? '')
      .replace(/\{apellido\}/gi, contact.last_name ?? '')

    const result = await provider.sendSMS({ to: contact.phone!, body: personalizedBody })
    if (result.ok) sent++
    else failed++
  }

  await supabase
    .from('sms_campaigns')
    .update({
      status:          failed === recipients.length ? 'failed' : 'sent',
      sent_at:         new Date().toISOString(),
      recipient_count: sent,
    })
    .eq('id', campaignId)

  return { sent, failed }
}

// ── sendTestSms ───────────────────────────────────────────────────────────────

export async function sendTestSms(campaignId: string, toPhone: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role, full_name, campaign_ids')
    .eq('id', user.id)
    .single()

  const canSend = ['super_admin', 'campaign_manager', 'analyst'].includes(profile?.role ?? '')
  if (!canSend) return { error: 'No tienes permiso para enviar SMS de prueba' }

  const activeCampaignId = profile?.campaign_ids?.[0] ?? ''

  const { data: smsCampaign } = await supabase
    .from('sms_campaigns').select('body_text').eq('id', campaignId).single()

  if (!smsCampaign) return { error: 'Campaña SMS no encontrada' }

  let provider
  try {
    provider = await getMessagingProvider(
      supabase,
      createAdminClient(),
      profile!.tenant_id,
      activeCampaignId || null,
      'sms'
    )
  } catch (err) {
    if (err instanceof MessagingConfigError) return { error: err.message }
    throw err
  }

  const previewBody = smsCampaign.body_text
    .replace(/\{nombre\}/gi,  profile?.full_name?.split(' ')[0] ?? 'Usuario')
    .replace(/\{apellido\}/gi, profile?.full_name?.split(' ')[1] ?? '')

  const result = await provider.sendSMS({ to: toPhone, body: `[PRUEBA] ${previewBody}` })
  if (!result.ok) return { error: result.error || 'Error al enviar el SMS de prueba' }
  return { ok: true }
}

// ── deleteSmsCampaign ─────────────────────────────────────────────────────────

export async function deleteSmsCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids').eq('id', user.id).single()

  const { data: campaign } = await supabase
    .from('sms_campaigns').select('campaign_id').eq('id', id).single()
  if (!campaign || !profile?.campaign_ids?.includes(campaign.campaign_id)) redirect('/dashboard/comunicaciones?tab=sms')

  await supabase.from('sms_campaigns').delete().eq('id', id)
  redirect('/dashboard/comunicaciones?tab=sms')
}
