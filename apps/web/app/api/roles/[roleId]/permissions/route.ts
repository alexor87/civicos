import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const { roleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch {
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  const can = await checkPermission(admin, user.id, 'roles.manage')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data: permissions } = await admin
    .from('role_permissions')
    .select('permission, is_active')
    .eq('role_id', roleId)
    .order('permission')

  return NextResponse.json(permissions ?? [])
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roleId: string }> }
) {
  const { roleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch {
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  const can = await checkPermission(admin, user.id, 'roles.manage')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { permissions } = body // Array of { permission: string, is_active: boolean }

  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: 'permissions debe ser un array' }, { status: 400 })
  }

  // Get tenant_id from the role
  const { data: role } = await admin
    .from('custom_roles')
    .select('tenant_id')
    .eq('id', roleId)
    .single()

  if (!role) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })

  // Upsert permissions directly (admin client bypasses RLS)
  const rows = permissions.map((p: { permission: string; is_active: boolean }) => ({
    tenant_id: role.tenant_id,
    role_id: roleId,
    permission: p.permission,
    is_active: p.is_active,
  }))

  const { error } = await admin
    .from('role_permissions')
    .upsert(rows, { onConflict: 'tenant_id,role_id,permission' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
