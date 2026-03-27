import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side permission check.
 * Used in API routes and server components.
 */
export async function checkPermission(
  supabase: SupabaseClient,
  userId: string,
  permission: string
): Promise<boolean> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, custom_role_id, tenant_id')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('[checkPermission] profile query error:', profileError.message, '| userId:', userId)
  }
  if (!profile) return false
  if (profile.role === 'super_admin') return true

  // Resolve the role_id
  let roleId: string | null = profile.custom_role_id

  if (!roleId) {
    const { data: sysRole } = await supabase
      .from('custom_roles')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('base_role_key', profile.role)
      .eq('is_system', true)
      .single()

    roleId = sysRole?.id ?? null
  }

  if (!roleId) return false

  const { data: perm } = await supabase
    .from('role_permissions')
    .select('is_active')
    .eq('role_id', roleId)
    .eq('permission', permission)
    .single()

  return perm?.is_active ?? false
}

/**
 * Check multiple permissions at once (server-side).
 */
export async function checkPermissions(
  supabase: SupabaseClient,
  userId: string,
  permissions: string[]
): Promise<Record<string, boolean>> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, custom_role_id, tenant_id')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('[checkPermissions] profile query error:', profileError.message, '| userId:', userId)
  }
  if (!profile) {
    return Object.fromEntries(permissions.map(p => [p, false]))
  }

  if (profile.role === 'super_admin') {
    return Object.fromEntries(permissions.map(p => [p, true]))
  }

  let roleId: string | null = profile.custom_role_id

  if (!roleId) {
    const { data: sysRole } = await supabase
      .from('custom_roles')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('base_role_key', profile.role)
      .eq('is_system', true)
      .single()

    roleId = sysRole?.id ?? null
  }

  if (!roleId) {
    return Object.fromEntries(permissions.map(p => [p, false]))
  }

  const { data: perms } = await supabase
    .from('role_permissions')
    .select('permission, is_active')
    .eq('role_id', roleId)
    .in('permission', permissions)

  const result: Record<string, boolean> = {}
  for (const p of permissions) {
    const found = perms?.find((r: { permission: string; is_active: boolean }) => r.permission === p)
    result[p] = found?.is_active ?? false
  }
  return result
}
