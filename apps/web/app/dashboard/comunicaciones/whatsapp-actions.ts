'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMessagingProvider } from '@/lib/messaging/dispatcher'
import { MessagingConfigError } from '@/lib/messaging/types'
import { applyFilters } from '@/app/dashboard/contacts/segments/actions'
import type { SegmentFilter } from '@/lib/types/database'

// ── createWhatsAppCampaign ────────────────────────────────────────────────────

export async function createWhatsAppCampaign(formData: FormData): Promise<void> {
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

  const name               = (formData.get('name') as string)?.trim()
  const template_name      = (formData.get('template_name') as string)?.trim()
  const template_variables = (formData.get('template_variables') as string) || '{}'
  const segment_id         = (formData.get('segment_id') as string) || null

  if (!name || !template_name) return

  let parsedVariables: Record<string, string> = {}
  try { parsedVariables = JSON.parse(template_variables) } catch { /* ignore */ }

  const { data, error } = await supabase
    .from('whatsapp_campaigns')
    .insert({
      tenant_id:          profile?.tenant_id,
      campaign_id:        profile?.campaign_ids?.[0] ?? null,
      name,
      template_name,
      template_variables: parsedVariables,
      segment_id:         segment_id || null,
      status:             'draft',
      recipient_count:    0,
      created_by:         user.id,
    })
    .select('id')
    .single()

  if (error || !data) return

  redirect(`/dashboard/comunicaciones/whatsapp/${data.id}`)
}

// ── updateWhatsAppCampaign ────────────────────────────────────────────────────

export async function updateWhatsAppCampaign(campaignId: string, formData: FormData): Promise<void> {
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

  const name               = (formData.get('name') as string)?.trim()
  const template_name      = (formData.get('template_name') as string)?.trim()
  const template_variables = (formData.get('template_variables') as string) || '{}'
  const segment_id         = (formData.get('segment_id') as string) || null

  if (!name || !template_name) return

  let parsedVariables: Record<string, string> = {}
  try { parsedVariables = JSON.parse(template_variables) } catch { /* ignore */ }

  await supabase
    .from('whatsapp_campaigns')
    .update({ name, template_name, template_variables: parsedVariables, segment_id: segment_id || null })
    .eq('id', campaignId)
    .eq('status', 'draft')

  redirect(`/dashboard/comunicaciones/whatsapp/${campaignId}`)
}

// ── sendWhatsAppCampaign ──────────────────────────────────────────────────────

export async function sendWhatsAppCampaign(campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canSend = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canSend) return { error: 'No tienes permiso para enviar campañas de WhatsApp' }

  const { data: waCampaign } = await supabase
    .from('whatsapp_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!waCampaign) return { error: 'Campaña de WhatsApp no encontrada' }
  if (waCampaign.status === 'sent') return { error: 'Esta campaña ya fue enviada' }

  const activeCampaignId = profile?.campaign_ids?.[0] ?? ''

  let provider
  try {
    provider = await getMessagingProvider(
      supabase,
      createAdminClient(),
      profile!.tenant_id,
      activeCampaignId || null,
      'whatsapp'
    )
  } catch (err) {
    if (err instanceof MessagingConfigError) return { error: err.message }
    throw err
  }

  let contacts: { id: string; phone: string | null; first_name: string; last_name: string }[] = []

  if (waCampaign.segment_id) {
    const { data: segment } = await supabase
      .from('contact_segments')
      .select('filters')
      .eq('id', waCampaign.segment_id)
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

  let sent   = 0
  let failed = 0

  for (const contact of recipients) {
    const result = await provider.sendWhatsApp({
      to:                contact.phone!,
      templateId:        waCampaign.template_name,
      templateVariables: (waCampaign.template_variables ?? {}) as Record<string, string>,
    })

    if (result.ok) {
      await supabase.from('whatsapp_conversations').insert({
        tenant_id:           profile!.tenant_id,
        campaign_id:         activeCampaignId,
        whatsapp_campaign_id: campaignId,
        contact_id:          contact.id,
        direction:           'outbound',
        body:                waCampaign.template_name,
        twilio_message_sid:  result.providerMessageId ?? '',
        status:              'sent',
      })
      sent++
    } else {
      failed++
    }
  }

  await supabase
    .from('whatsapp_campaigns')
    .update({
      status:          failed === recipients.length ? 'failed' : 'sent',
      sent_at:         new Date().toISOString(),
      recipient_count: sent,
    })
    .eq('id', campaignId)

  return { sent, failed }
}

// ── deleteWhatsAppCampaign ────────────────────────────────────────────────────

export async function deleteWhatsAppCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids').eq('id', user.id).single()

  const { data: campaign } = await supabase
    .from('whatsapp_campaigns').select('campaign_id').eq('id', id).single()

  if (!campaign || !profile?.campaign_ids?.includes(campaign.campaign_id)) {
    redirect('/dashboard/comunicaciones?tab=whatsapp')
  }

  await supabase.from('whatsapp_campaigns').delete().eq('id', id)
  redirect('/dashboard/comunicaciones?tab=whatsapp')
}

// ── getWhatsAppConversations ──────────────────────────────────────────────────

export async function getWhatsAppConversations(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })

  return data ?? []
}

// ── getChatbotConfig ──────────────────────────────────────────────────────────

export async function getChatbotConfig(campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('whatsapp_chatbot_config')
    .select('*')
    .eq('campaign_id', campaignId)
    .single()

  return data ?? null
}

// ── upsertChatbotConfig ───────────────────────────────────────────────────────

export async function upsertChatbotConfig(
  campaignId: string,
  config: { enabled: boolean; system_prompt: string; fallback_message: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  const canManage = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canManage) return { error: 'Sin permisos' }

  const { error } = await supabase
    .from('whatsapp_chatbot_config')
    .upsert({
      tenant_id:        profile!.tenant_id,
      campaign_id:      campaignId,
      enabled:          config.enabled,
      system_prompt:    config.system_prompt,
      fallback_message: config.fallback_message,
      updated_at:       new Date().toISOString(),
    }, { onConflict: 'campaign_id' })

  if (error) return { error: error.message }
  return { ok: true }
}
