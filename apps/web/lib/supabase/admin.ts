import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client using the service role key.
 * Only for server-side use — NEVER expose to the browser.
 * Required for: generating auth links, managing auth users.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
export function createAdminClient() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !secret) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables'
    )
  }

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
}
