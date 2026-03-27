import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const { roleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const can = await checkPermission(supabase, user.id, 'roles.manage')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const admin = createAdminClient()

  const body = await request.json()
  const { name, description, color } = body

  // Cannot rename system roles
  const { data: role } = await admin
    .from('custom_roles')
    .select('is_system')
    .eq('id', roleId)
    .single()

  if (!role) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })

  const updateData: Record<string, any> = {}
  if (color) updateData.color = color
  if (description !== undefined) updateData.description = description

  if (name && !role.is_system) {
    updateData.name = name.trim()
    updateData.slug = name.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const { error } = await admin
    .from('custom_roles')
    .update(updateData)
    .eq('id', roleId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const { roleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const can = await checkPermission(supabase, user.id, 'roles.manage')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const admin = createAdminClient()

  // Cannot delete system roles
  const { data: role } = await admin
    .from('custom_roles')
    .select('is_system, tenant_id')
    .eq('id', roleId)
    .single()

  if (!role) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
  if (role.is_system) return NextResponse.json({ error: 'No se pueden eliminar roles del sistema' }, { status: 400 })

  const body = await request.json()
  const { reassign_to_role_id } = body

  if (!reassign_to_role_id) {
    return NextResponse.json({ error: 'Debes indicar un rol de reasignación' }, { status: 400 })
  }

  // Move members to the new role
  await admin
    .from('profiles')
    .update({ custom_role_id: reassign_to_role_id })
    .eq('custom_role_id', roleId)
    .eq('tenant_id', role.tenant_id)

  // Delete permissions first (cascade should handle this, but be explicit)
  await admin
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId)

  // Delete the role
  const { error } = await admin
    .from('custom_roles')
    .delete()
    .eq('id', roleId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
