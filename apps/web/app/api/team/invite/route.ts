import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'
import { getAppUrl, sendInviteEmail } from '@/lib/email/transactional'
import { addExistingUserToTenant } from '@/lib/team/add-existing-user-to-tenant'
import type { InviteRole } from '@/lib/email/templates/invite-email'

const VALID_ROLES: InviteRole[] = [
  'field_coordinator',
  'volunteer',
  'analyst',
  'comms_coordinator',
]

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const canInvite = await checkPermission(supabase, user.id, 'team.invite')
  if (!canInvite) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role, full_name')
    .eq('id', user.id)
    .single()

  const body = await request.json()
  const { email, role, full_name, phone } = body

  if (!email || !role) {
    return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 })
  }

  if (!VALID_ROLES.includes(role as InviteRole)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const inviteeName = full_name?.trim() || normalizedEmail.split('@')[0]
  const campaignIds: string[] = profile?.campaign_ids ?? []

  let campaignName = 'tu campaña'
  if (campaignIds.length > 0) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name')
      .eq('id', campaignIds[0])
      .single()
    if (campaign?.name) campaignName = campaign.name
  }

  const inviterName = profile?.full_name?.trim() || 'Tu equipo'
  const appUrl = getAppUrl()

  try {
    const admin = createAdminClient()

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: normalizedEmail,
      options: {
        redirectTo: `${appUrl}/auth/callback?next=/welcome`,
        data: {
          full_name:    inviteeName,
          role,
          phone:        phone?.trim() || undefined,
          tenant_id:    profile?.tenant_id,
          campaign_ids: campaignIds,
        },
      },
    })

    if (linkError) {
      // Multi-tenant fallback: if the email already belongs to an auth user,
      // grant access to this tenant via tenant_users + send notification email.
      if (linkError.message.toLowerCase().includes('already been registered')) {
        const targetTenantId = profile?.tenant_id
        if (!targetTenantId) {
          return NextResponse.json({ error: 'No se pudo determinar el tenant destino' }, { status: 400 })
        }
        const result = await addExistingUserToTenant({
          inviteeEmail:      normalizedEmail,
          inviteeName,
          inviterName,
          targetTenantId,
          targetCampaignIds: campaignIds,
          role:              role as InviteRole,
        })
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 500 })
        }
        return NextResponse.json({
          success:       true,
          existing_user: true,
          email_failed:  result.email_failed ?? false,
        })
      }

      return NextResponse.json(
        { error: linkError.message || 'No se pudo generar el link de invitación' },
        { status: 400 }
      )
    }
    if (!linkData?.properties?.hashed_token) {
      return NextResponse.json(
        { error: 'No se pudo generar el link de invitación' },
        { status: 400 }
      )
    }

    const actionLink =
      linkData.properties.action_link ||
      `${appUrl}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=invite&next=/welcome`

    const sendResult = await sendInviteEmail({
      to: normalizedEmail,
      inviteeName,
      inviterName,
      campaignName,
      role: role as InviteRole,
      actionLink,
    })

    if (!sendResult.ok) {
      return NextResponse.json(
        {
          error:
            `Usuario creado pero falló el envío del email: ${sendResult.error}. Reenvía la invitación desde la lista de equipo.`,
        },
        { status: 502 }
      )
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
