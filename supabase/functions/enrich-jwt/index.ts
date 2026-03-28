import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge Function: enrich-jwt
// Called as Supabase Custom Access Token hook.
// Adds tenant_id and user_role to JWT claims for RLS policies.
// CRITICAL: Never overwrite 'role' — it's reserved by Supabase (must stay 'authenticated').
// CRITICAL: On ANY error, return original claims unchanged to avoid breaking login.

Deno.serve(async (req: Request) => {
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ claims: {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { user_id, claims: existingClaims } = payload

  if (!user_id || !existingClaims) {
    return new Response(JSON.stringify({ claims: existingClaims ?? {} }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user_id)
      .single()

    // Reject login if profile doesn't exist — prevents orphaned sessions
    if (!profile || profileError || !profile.tenant_id) {
      return new Response(JSON.stringify({ error: 'Profile not found or incomplete' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const claims = {
      ...existingClaims,
      tenant_id: profile.tenant_id,
      user_role: profile.role,
    }

    return new Response(JSON.stringify({ claims }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    // On ANY error, return original claims to avoid breaking login
    return new Response(JSON.stringify({ claims: existingClaims }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
