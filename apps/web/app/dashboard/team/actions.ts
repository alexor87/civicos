'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ROLES = ['field_coordinator', 'volunteer', 'analyst']

export async function inviteTeamMember(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canInvite = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canInvite) return

  const fullName = (formData.get('full_name') as string)?.trim()
  const email    = (formData.get('email')     as string)?.trim().toLowerCase()
  const phone    = (formData.get('phone')     as string)?.trim() || null
  const role     = formData.get('role') as string

  if (!fullName || !email || !VALID_ROLES.includes(role)) return

  // Use admin client to send a proper Supabase auth invitation by email.
  // This creates the auth user, sends the invite email, and the DB trigger
  // creates their profile with the provided user_metadata.
  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name:    fullName,
        role,
        phone:        phone ?? undefined,
        tenant_id:    profile?.tenant_id,
        campaign_ids: profile?.campaign_ids ?? [],
      },
    })
    if (error) {
      console.error('[inviteTeamMember] Auth invite error:', error.message)
      return
    }
  } catch (err) {
    console.error('[inviteTeamMember] Admin client error:', err)
    return
  }

  redirect('/dashboard/team')
}

export async function promoteContactToMember(contactId: string, role: string): Promise<{ error?: string }> {
  if (!VALID_ROLES.includes(role)) return { error: 'Rol inválido' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canInvite = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canInvite) return { error: 'Sin permisos' }

  const { data: contact } = await supabase
    .from('contacts')
    .select('first_name, last_name, email, phone')
    .eq('id', contactId)
    .single()

  if (!contact)       return { error: 'Contacto no encontrado' }
  if (!contact.email) return { error: 'El contacto no tiene email registrado' }

  const fullName = `${contact.first_name} ${contact.last_name}`.trim()

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.inviteUserByEmail(contact.email, {
      data: {
        full_name:    fullName,
        role,
        phone:        contact.phone ?? undefined,
        tenant_id:    profile?.tenant_id,
        campaign_ids: profile?.campaign_ids ?? [],
      },
    })

    if (error) {
      // User already exists in auth — add them to this tenant instead
      if (error.message.includes('already been registered')) {
        const { data: { users } } = await admin.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === contact.email)
        if (!existingUser) return { error: 'No se encontró el usuario registrado' }

        // Check if already a member of this tenant
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('tenant_id, campaign_ids')
          .eq('id', existingUser.id)
          .single()

        if (existingProfile?.tenant_id === profile?.tenant_id) {
          // Same tenant — just make sure campaign_ids are updated
          const mergedCampaigns = Array.from(new Set([
            ...(existingProfile.campaign_ids ?? []),
            ...(profile?.campaign_ids ?? []),
          ]))
          const { error: updateErr } = await admin
            .from('profiles')
            .update({ role, campaign_ids: mergedCampaigns })
            .eq('id', existingUser.id)
          if (updateErr) return { error: updateErr.message }
          return {}
        }

        // Different tenant — move to this tenant
        const { error: updateErr } = await admin
          .from('profiles')
          .update({
            tenant_id:    profile?.tenant_id,
            role,
            full_name:    fullName,
            campaign_ids: profile?.campaign_ids ?? [],
          })
          .eq('id', existingUser.id)
        if (updateErr) return { error: updateErr.message }
        return {}
      }

      return { error: error.message }
    }
  } catch (err) {
    return { error: String(err) }
  }

  return {}
}
