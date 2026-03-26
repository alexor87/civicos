import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_ROLES = ['field_coordinator', 'volunteer', 'analyst', 'comms_coordinator', 'campaign_manager']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!['super_admin', 'campaign_manager'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { role } = body

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  // Verify target member belongs to the same tenant
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', memberId)
    .single()

  if (!targetProfile || targetProfile.tenant_id !== profile?.tenant_id) {
    return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
