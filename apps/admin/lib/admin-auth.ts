import { createAdminClient } from './supabase/admin'
import { createClient } from './supabase/server'

export interface AdminUser {
  id: string
  user_id: string
  email: string
  full_name: string
  is_active: boolean
  last_login_at: string | null
}

/**
 * Verify that a Supabase auth user is a valid, active Scrutix admin.
 * Returns the admin_users row if valid, null otherwise.
 */
export async function verifyAdminUser(authUserId: string): Promise<AdminUser | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', authUserId)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data as AdminUser
}

/**
 * Update last_login_at for an admin user.
 */
export async function updateAdminLastLogin(adminId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', adminId)
}

/**
 * Get the current admin user from the request cookies.
 * Uses the SSR Supabase client to read the auth session,
 * then verifies against admin_users table.
 */
export async function getAdminFromRequest(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return verifyAdminUser(user.id)
}
