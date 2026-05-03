'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl, sendInviteEmail } from '@/lib/email/transactional'
import { addExistingUserToTenant, type AddExistingUserResult } from '@/lib/team/add-existing-user-to-tenant'
import type { InviteRole } from '@/lib/email/templates/invite-email'

const VALID_ROLES: InviteRole[] = ['field_coordinator', 'volunteer', 'analyst']

interface InviteContext {
  email: string
  fullName: string
  phone: string | null
  role: InviteRole
  tenantId: string | null | undefined
  campaignIds: string[]
  inviterName: string
}

export type TeamActionResult = AddExistingUserResult

async function issueInvite(ctx: InviteContext): Promise<{ error?: string }> {
  const appUrl = getAppUrl()
  const admin = createAdminClient()

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: ctx.email,
    options: {
      redirectTo: `${appUrl}/auth/callback?next=/welcome`,
      data: {
        full_name:    ctx.fullName,
        role:         ctx.role,
        phone:        ctx.phone ?? undefined,
        tenant_id:    ctx.tenantId,
        campaign_ids: ctx.campaignIds,
      },
    },
  })

  if (linkError) {
    return { error: linkError.message }
  }
  if (!linkData?.properties?.hashed_token) {
    return { error: 'No se pudo generar el link de invitación' }
  }

  const actionLink =
    linkData.properties.action_link ||
    `${appUrl}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=invite&next=/welcome`

  const supabase = await createClient()
  let campaignName = 'tu campaña'
  if (ctx.campaignIds.length > 0) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name')
      .eq('id', ctx.campaignIds[0])
      .single()
    if (campaign?.name) campaignName = campaign.name
  }

  const sendResult = await sendInviteEmail({
    to: ctx.email,
    inviteeName: ctx.fullName,
    inviterName: ctx.inviterName,
    campaignName,
    role: ctx.role,
    actionLink,
  })

  if (!sendResult.ok) {
    return { error: `Email no enviado: ${sendResult.error}` }
  }

  return {}
}

export async function inviteTeamMember(formData: FormData): Promise<TeamActionResult | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role, full_name')
    .eq('id', user.id)
    .single()

  const canInvite = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canInvite) return

  const fullName = (formData.get('full_name') as string)?.trim()
  const email    = (formData.get('email')     as string)?.trim().toLowerCase()
  const phone    = (formData.get('phone')     as string)?.trim() || null
  const role     = formData.get('role') as string

  if (!fullName || !email || !VALID_ROLES.includes(role as InviteRole)) return

  const result = await issueInvite({
    email,
    fullName,
    phone,
    role: role as InviteRole,
    tenantId: profile?.tenant_id,
    campaignIds: profile?.campaign_ids ?? [],
    inviterName: profile?.full_name?.trim() || 'Tu equipo',
  })

  if (result.error) {
    if (result.error.toLowerCase().includes('already been registered')) {
      const targetTenantId = profile?.tenant_id
      if (!targetTenantId) return { error: 'No se pudo determinar el tenant destino' }

      return await addExistingUserToTenant({
        inviteeEmail:      email,
        inviteeName:       fullName,
        inviterName:       profile?.full_name?.trim() || 'Tu equipo',
        targetTenantId,
        targetCampaignIds: profile?.campaign_ids ?? [],
        role:              role as InviteRole,
      })
    }

    return { error: result.error }
  }

  redirect('/dashboard/team')
}

export async function promoteContactToMember(
  contactId: string,
  role: string
): Promise<TeamActionResult> {
  if (!VALID_ROLES.includes(role as InviteRole)) return { error: 'Rol inválido' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role, full_name')
    .eq('id', user.id)
    .single()

  const canInvite = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canInvite) return { error: 'Sin permisos' }

  const { data: contact } = await supabase
    .from('contacts')
    .select('first_name, last_name, email, phone')
    .eq('id', contactId)
    .is('deleted_at', null)
    .single()

  if (!contact)       return { error: 'Contacto no encontrado' }
  if (!contact.email) return { error: 'El contacto no tiene email registrado' }

  const fullName = `${contact.first_name} ${contact.last_name}`.trim()

  const result = await issueInvite({
    email: contact.email,
    fullName,
    phone: contact.phone ?? null,
    role: role as InviteRole,
    tenantId: profile?.tenant_id,
    campaignIds: profile?.campaign_ids ?? [],
    inviterName: profile?.full_name?.trim() || 'Tu equipo',
  })

  if (result.error) {
    if (result.error.toLowerCase().includes('already been registered')) {
      const targetTenantId = profile?.tenant_id
      if (!targetTenantId) return { error: 'No se pudo determinar el tenant destino' }

      return await addExistingUserToTenant({
        inviteeEmail:      contact.email,
        inviteeName:       fullName,
        inviterName:       profile?.full_name?.trim() || 'Tu equipo',
        targetTenantId,
        targetCampaignIds: profile?.campaign_ids ?? [],
        role:              role as InviteRole,
      })
    }

    return { error: result.error }
  }

  return {}
}
