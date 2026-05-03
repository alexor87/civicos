import { createAdminClient } from '@/lib/supabase/admin'
import { sendAccessGrantedEmail } from '@/lib/email/transactional'
import type { InviteRole } from '@/lib/email/templates/invite-email'

export interface AddExistingUserResult {
  error?:         string
  existing_user?: boolean
  email_failed?:  boolean
}

/**
 * Multi-tenant fallback for "user already registered" flows.
 *
 * Looks up the existing auth user by email, then either INSERTs a new
 * tenant_users row (and sends a notification email) or UPDATEs the existing
 * one (merging campaigns, no email since the user already had access).
 *
 * Email failures do not roll back the membership row.
 */
export async function addExistingUserToTenant(params: {
  inviteeEmail:      string
  inviteeName:       string
  inviterName:       string
  targetTenantId:    string
  targetCampaignIds: string[]
  role:              InviteRole
}): Promise<AddExistingUserResult> {
  const admin = createAdminClient()
  const { data: { users } } = await admin.auth.admin.listUsers()
  const existingUser = users.find(u => u.email === params.inviteeEmail)
  if (!existingUser) return { error: 'No se encontró el usuario registrado' }

  const { data: existingMembership } = await admin
    .from('tenant_users')
    .select('campaign_ids, role')
    .eq('user_id', existingUser.id)
    .eq('tenant_id', params.targetTenantId)
    .maybeSingle()

  const mergedCampaigns = Array.from(new Set([
    ...(existingMembership?.campaign_ids ?? []),
    ...params.targetCampaignIds,
  ]))

  if (existingMembership) {
    const { error: updateErr } = await admin
      .from('tenant_users')
      .update({ role: params.role, campaign_ids: mergedCampaigns })
      .eq('user_id', existingUser.id)
      .eq('tenant_id', params.targetTenantId)
    if (updateErr) return { error: updateErr.message }
    return { existing_user: true }
  }

  const { error: insertErr } = await admin
    .from('tenant_users')
    .insert({
      user_id:      existingUser.id,
      tenant_id:    params.targetTenantId,
      role:         params.role,
      campaign_ids: mergedCampaigns,
    })
  if (insertErr) return { error: insertErr.message }

  const { data: tenant } = await admin
    .from('tenants')
    .select('name')
    .eq('id', params.targetTenantId)
    .single()

  let campaignNames: string[] = []
  if (mergedCampaigns.length > 0) {
    const { data: camps } = await admin
      .from('campaigns')
      .select('name')
      .in('id', mergedCampaigns)
    campaignNames = (camps ?? []).map((c: { name: string }) => c.name).filter(Boolean)
  }

  const sendResult = await sendAccessGrantedEmail({
    to:            params.inviteeEmail,
    inviteeName:   params.inviteeName,
    inviterName:   params.inviterName,
    tenantName:    tenant?.name ?? '',
    role:          params.role,
    campaignNames,
  })

  return sendResult.ok
    ? { existing_user: true }
    : { existing_user: true, email_failed: true }
}
