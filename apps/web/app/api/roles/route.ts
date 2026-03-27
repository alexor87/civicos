import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Permission check via SECURITY DEFINER RPC (bypasses RLS entirely).
 * Falls back to a direct profile check if the RPC doesn't exist yet.
 */
async function canManageRoles(
  supabase: any,
  userId: string
): Promise<boolean> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'check_user_permission',
    { p_user_id: userId, p_permission: 'roles.manage' }
  )
  if (!rpcError && rpcResult !== null) return rpcResult === true

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role === 'super_admin'
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const can = await canManageRoles(supabase, user.id)
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  // Get tenant_id (profiles_select_own policy — always works)
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  // Single SECURITY DEFINER RPC: auto-inits roles if needed + returns roles with member counts
  const { data: roles, error } = await supabase.rpc('get_tenant_roles', {
    p_tenant_id: profile.tenant_id,
  })

  if (error) {
    console.error('[roles/GET] get_tenant_roles RPC failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(roles ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Permission check via SECURITY DEFINER RPC
  const can = await canManageRoles(supabase, user.id)
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch { admin = null as any }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  const tenantId = profile.tenant_id

  const body = await request.json()
  const { name, description, color, base_role_id } = body

  if (!name || name.trim().length < 3) {
    return NextResponse.json({ error: 'El nombre debe tener al menos 3 caracteres' }, { status: 400 })
  }

  if (name.trim().length > 40) {
    return NextResponse.json({ error: 'El nombre no puede tener más de 40 caracteres' }, { status: 400 })
  }

  const slug = name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Use whichever client works for custom_roles queries
  const db = admin || supabase

  const { data: existing } = await db
    .from('custom_roles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 409 })
  }

  const systemSlugs = ['super-admin', 'campaign-manager', 'field-coordinator', 'voluntario', 'analista']
  if (systemSlugs.includes(slug)) {
    return NextResponse.json({ error: 'No se puede usar un nombre de rol del sistema' }, { status: 400 })
  }

  const { data: newRole, error } = await db
    .from('custom_roles')
    .insert({
      tenant_id: tenantId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      color: color || '#6366F1',
      is_system: false,
      base_role_key: null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (base_role_id) {
    const { data: basePerms } = await db
      .from('role_permissions')
      .select('permission, is_active')
      .eq('role_id', base_role_id)

    if (basePerms && basePerms.length > 0) {
      const newPerms = basePerms.map((p: { permission: string; is_active: boolean }) => ({
        tenant_id: tenantId,
        role_id: newRole.id,
        permission: p.permission,
        is_active: p.is_active,
      }))
      await db.from('role_permissions').insert(newPerms)
    }
  } else {
    const { ALL_PERMISSIONS } = await import('@/lib/permissions')
    const newPerms = ALL_PERMISSIONS.map((p: string) => ({
      tenant_id: tenantId,
      role_id: newRole.id,
      permission: p,
      is_active: false,
    }))
    await db.from('role_permissions').insert(newPerms)
  }

  return NextResponse.json(newRole, { status: 201 })
}
