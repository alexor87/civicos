import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge Function: enrich-jwt
// Called as Supabase Custom Access Token hook.
// Adds tenant_id, user_role, plan, and resolved feature flags to JWT claims.
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

    // 1. Fetch profile with tenant data (plan, status, expiry)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, role, tenants(plan, status, plan_expires_at)')
      .eq('id', user_id)
      .single()

    // Reject login if profile doesn't exist — prevents orphaned sessions
    if (!profile || profileError || !profile.tenant_id) {
      return new Response(JSON.stringify({ error: 'Profile not found or incomplete' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const tenant = profile.tenants as { plan: string; status: string; plan_expires_at: string | null } | null

    // Build base claims (always included)
    const claims: Record<string, unknown> = {
      ...existingClaims,
      tenant_id: profile.tenant_id,
      user_role: profile.role,
      plan: tenant?.plan ?? 'esencial',
      plan_expires_at: tenant?.plan_expires_at ?? null,
      tenant_status: tenant?.status ?? 'active',
    }

    // 2. Resolve feature flags (separate try/catch — features failure shouldn't break login)
    try {
      const { data: resolved } = await supabase
        .rpc('resolve_all_tenant_features', {
          p_tenant_id: profile.tenant_id,
          p_plan: tenant?.plan ?? 'esencial',
        })

      if (resolved && Array.isArray(resolved)) {
        const features: Record<string, unknown> = {}
        for (const row of resolved) {
          features[row.feature_key] = row.resolved_value
        }
        claims.features = features
      }
    } catch {
      // Features resolution failed — continue without features in JWT
      // Tenant will still have access, just without feature gating
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
