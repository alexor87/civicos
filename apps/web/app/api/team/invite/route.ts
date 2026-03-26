import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ROLES = ['field_coordinator', 'volunteer', 'analyst', 'comms_coordinator']

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canInvite = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canInvite) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { email, role, full_name, phone } = body

  if (!email || !role) {
    return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 })
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.inviteUserByEmail(email.trim().toLowerCase(), {
      data: {
        full_name:    full_name?.trim() || email.split('@')[0],
        role,
        phone:        phone?.trim() || undefined,
        tenant_id:    profile?.tenant_id,
        campaign_ids: profile?.campaign_ids ?? [],
      },
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
