import { createAdminClient } from '@/lib/supabase/server'

/**
 * Server-side permission check.
 * Uses admin client (service role) to bypass RLS — the profiles table
 * RLS policy depends on JWT claims that may not resolve in all SSR contexts.
 */
export async function checkPermission(
  _supabase: unknown,
  userId: string,
  permission: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, custom_role_id, tenant_id')
    .eq('id', userId)
    .single()

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
  _supabase: unknown,
  userId: string,
  permissions: string[]
): Promise<Record<string, boolean>> {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, custom_role_id, tenant_id')
    .eq('id', userId)
    .single()

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
