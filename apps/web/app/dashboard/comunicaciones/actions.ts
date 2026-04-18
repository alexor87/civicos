'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { getIntegrationConfig } from '@/lib/get-integration-config'
import { buildResendFrom } from '@/lib/email/build-resend-from'
import { applyFilters } from '@/app/dashboard/contacts/segments/actions'
import type { SegmentFilter } from '@/lib/types/database'

// ── createCampaign ────────────────────────────────────────────────────────────

export async function createCampaign(formData: FormData): Promise<void> {
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

  const name        = (formData.get('name') as string)?.trim()
  const subject     = (formData.get('subject') as string)?.trim()
  const body_html   = (formData.get('body_html') as string)?.trim()
  const segment_id  = (formData.get('segment_id') as string) || null
  const is_template = formData.get('is_template') === 'true'

  if (!name || !subject || !body_html) return

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({
      tenant_id:       profile?.tenant_id,
      campaign_id:     profile?.campaign_ids?.[0] ?? null,
      name,
      subject,
      body_html,
      body_text:       null,
      segment_id:      is_template ? null : (segment_id || null),
      status:          'draft',
      recipient_count: 0,
      is_template,
      created_by:      user.id,
    })
    .select('id')
    .single()

  if (error || !data) return

  redirect(is_template
    ? `/dashboard/comunicaciones?tab=email&type=templates`
    : `/dashboard/comunicaciones/${data.id}`
  )
}

// ── updateCampaign ────────────────────────────────────────────────────────────

export async function updateCampaign(campaignId: string, formData: FormData): Promise<void> {
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

  const name      = (formData.get('name') as string)?.trim()
  const subject   = (formData.get('subject') as string)?.trim()
  const body_html = (formData.get('body_html') as string)?.trim()
  const segment_id = (formData.get('segment_id') as string) || null

  if (!name || !subject || !body_html) return

  const { error } = await supabase
    .from('email_campaigns')
    .update({ name, subject, body_html, segment_id: segment_id || null })
    .eq('id', campaignId)
    .eq('status', 'draft') // safety: only edit drafts

  if (error) return

  redirect(`/dashboard/comunicaciones/${campaignId}`)
}

// ── sendCampaign ──────────────────────────────────────────────────────────────

export async function sendCampaign(campaignId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canSend = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canSend) return { error: 'No tienes permiso para enviar campañas' }

  const { data: emailCampaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!emailCampaign) return { error: 'Campaña no encontrada' }
  if (emailCampaign.status === 'sent') return { error: 'Esta campaña ya fue enviada' }

  const activeCampaignId = profile?.campaign_ids?.[0] ?? ''

  // Get contacts — filtered by segment if applicable
  let contacts: { id: string; email: string | null; first_name: string; last_name: string }[] = []

  if (emailCampaign.segment_id) {
    const { data: segment } = await supabase
      .from('contact_segments')
      .select('filters')
      .eq('id', emailCampaign.segment_id)
      .single()

    if (segment?.filters) {
      const result = await applyFilters(supabase, activeCampaignId, segment.filters as SegmentFilter[])
      contacts = (result.data ?? []) as typeof contacts
    }
  } else {
    const { data } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name')
      .eq('campaign_id', activeCampaignId)
      .is('deleted_at', null)
      .not('email', 'is', null)
    contacts = (data ?? []) as typeof contacts
  }

  const recipients = contacts.filter(c => c.email)

  if (recipients.length === 0) {
    return { error: 'No hay destinatarios con email en este segmento' }
  }

  // Get Resend API key from tenant integrations
  const adminSupabase = createAdminClient()
  const integrationConfig = await getIntegrationConfig(supabase, profile!.tenant_id, activeCampaignId)
  let resendApiKey = process.env.RESEND_API_KEY ?? ''
  if (integrationConfig?.resend_api_key) {
    const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', { encrypted: integrationConfig.resend_api_key })
    if (decrypted) resendApiKey = decrypted
    else resendApiKey = integrationConfig.resend_api_key
  }

  const resend = new Resend(resendApiKey)
  const fromAddress = buildResendFrom(integrationConfig ?? {}, process.env.EMAIL_FROM)

  let sent = 0
  let failed = 0

  for (const contact of recipients) {
    // Personalize HTML for each recipient
    const personalizedHtml = emailCampaign.body_html
      .replace(/\{nombre\}/gi, contact.first_name ?? '')
      .replace(/\{apellido\}/gi, contact.last_name ?? '')

    try {
      await resend.emails.send({
        from:    fromAddress,
        to:      contact.email!,
        subject: emailCampaign.subject,
        html:    personalizedHtml,
      })
      sent++
    } catch {
      failed++
    }
  }

  await supabase
    .from('email_campaigns')
    .update({
      status:          failed === recipients.length ? 'failed' : 'sent',
      sent_at:         new Date().toISOString(),
      recipient_count: sent,
    })
    .eq('id', campaignId)

  return { sent, failed }
}

// ── sendTestEmail ─────────────────────────────────────────────────────────────

export async function sendTestEmail(campaignId: string, toEmail: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role, full_name')
    .eq('id', user.id)
    .single()

  const canSend = ['super_admin', 'campaign_manager', 'analyst'].includes(profile?.role ?? '')
  if (!canSend) return { error: 'No tienes permiso para enviar emails de prueba' }

  const { data: emailCampaign } = await supabase
    .from('email_campaigns')
    .select('subject, body_html')
    .eq('id', campaignId)
    .single()

  if (!emailCampaign) return { error: 'Campaña no encontrada' }

  const previewHtml = emailCampaign.body_html
    .replace(/\{nombre\}/gi, profile?.full_name?.split(' ')[0] ?? 'Usuario')
    .replace(/\{apellido\}/gi, profile?.full_name?.split(' ')[1] ?? '')

  const activeCampaignId = profile?.campaign_ids?.[0] ?? ''
  const adminSupabase = createAdminClient()
  const integrationConfig = await getIntegrationConfig(supabase, profile!.tenant_id, activeCampaignId)
  let resendApiKey = process.env.RESEND_API_KEY ?? ''
  if (integrationConfig?.resend_api_key) {
    const { data: decrypted } = await adminSupabase.rpc('decrypt_integration_key', { encrypted: integrationConfig.resend_api_key })
    if (decrypted) resendApiKey = decrypted
    else resendApiKey = integrationConfig.resend_api_key
  }

  const resend = new Resend(resendApiKey)
  const fromAddress = buildResendFrom(integrationConfig ?? {}, process.env.EMAIL_FROM)

  try {
    await resend.emails.send({
      from:    fromAddress,
      to:      toEmail,
      subject: `[PRUEBA] ${emailCampaign.subject}`,
      html:    previewHtml,
    })
    return { ok: true }
  } catch {
    return { error: 'Error al enviar el email de prueba' }
  }
}

// ── deleteCampaign ────────────────────────────────────────────────────────────

export async function deleteCampaign(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('campaign_ids').eq('id', user.id).single()

  const { data: campaign } = await supabase
    .from('email_campaigns').select('campaign_id').eq('id', id).single()
  if (!campaign || !profile?.campaign_ids?.includes(campaign.campaign_id)) redirect('/dashboard/comunicaciones')

  await supabase.from('email_campaigns').delete().eq('id', id)
  redirect('/dashboard/comunicaciones')
}
