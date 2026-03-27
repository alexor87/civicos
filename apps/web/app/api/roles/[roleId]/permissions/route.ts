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

  const admin = createAdminClient()

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

  const admin = createAdminClient()

  const can = await checkPermission(admin, user.id, 'roles.manage')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { permissions } = body // Array of { permission: string, is_active: boolean }

  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: 'permissions debe ser un array' }, { status: 400 })
  }

  // Use the RPC function
  const { error } = await admin.rpc('save_role_permissions', {
    p_role_id: roleId,
    p_permissions: permissions,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
