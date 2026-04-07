import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// NOTE: Types are applied via explicit casts in queries.
// Run `supabase gen types typescript` after connecting to a live project
// to replace these with auto-generated types.

export async function createClient() {
  const cookieStore = await cookies()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies set via middleware
          }
        },
      },
    }
  )
}
// I-1: re-export the correct admin client (no cookies, pure service role)
// All code should prefer importing from @/lib/supabase/admin directly
export { createAdminClient } from '@/lib/supabase/admin'
