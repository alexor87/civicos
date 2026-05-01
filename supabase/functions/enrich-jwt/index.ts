import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge Function: enrich-jwt
// Called as Supabase Custom Access Token hook.
// Adds tenant_id, user_role, plan, tenant_ids[], active_tenant_id and
// resolved feature flags to JWT claims.
//
// Multi-tenant model:
//   • A user can belong to many tenants via the tenant_users table.
//   • profiles.active_tenant_id points to the currently selected tenant.
//   • The legacy `tenant_id` claim mirrors active_tenant_id so the ~120
//     existing RLS policies (`tenant_id = auth_tenant_id()`) keep working.
//   • `tenant_ids` (array of strings) is published so the UI can render the
//     tenant switcher.
//   • `user_role` reflects the role for the active tenant (from tenant_users).
//
// CRITICAL: Never overwrite `role` — it is reserved by Supabase.
// CRITICAL: On ANY error, return original claims unchanged to avoid breaking login.

Deno.serve(async (req: Request) => {
  let payload: { user_id?: string; claims?: Record<string, unknown> }
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

    // 1) Profile (user-level data + active tenant + legacy tenant_id fallback)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, active_tenant_id, role')
      .eq('id', user_id)
      .single()

    if (!profile || profileError) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2) Memberships — every tenant the user belongs to.
    const { data: memberships } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user_id)

    const tenantIds: string[] = (memberships ?? []).map(m => m.tenant_id as string)

    // Determine the active tenant. Priority:
    //   1) profiles.active_tenant_id (if it's still in tenant_ids)
    //   2) profiles.tenant_id legacy fallback
    //   3) first membership
    let activeTenantId: string | null = null
    if (profile.active_tenant_id && tenantIds.includes(profile.active_tenant_id as string)) {
      activeTenantId = profile.active_tenant_id as string
    } else if (profile.tenant_id && tenantIds.includes(profile.tenant_id as string)) {
      activeTenantId = profile.tenant_id as string
    } else if (tenantIds.length > 0) {
      activeTenantId = tenantIds[0]
    } else if (profile.tenant_id) {
      // Pre-migration fallback: user has no tenant_users row yet, use legacy.
      activeTenantId = profile.tenant_id as string
    }

    if (!activeTenantId) {
      return new Response(JSON.stringify({ error: 'User has no tenant memberships' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 3) Role for the active tenant. Prefer tenant_users.role, fallback to profiles.role.
    const activeMembership = (memberships ?? []).find(m => m.tenant_id === activeTenantId)
    const activeRole = (activeMembership?.role as string | undefined) ?? (profile.role as string)

    // 4) Tenant metadata (plan, status, expiry) for the active tenant.
    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan, status, plan_expires_at')
      .eq('id', activeTenantId)
      .single()

    // 5) Build the enriched claims.
    const claims: Record<string, unknown> = {
      ...existingClaims,
      tenant_id:        activeTenantId,                // legacy single-value claim
      tenant_ids:       tenantIds.length > 0 ? tenantIds : [activeTenantId],
      active_tenant_id: activeTenantId,
      user_role:        activeRole,
      plan:             tenant?.plan ?? 'esencial',
      plan_expires_at:  tenant?.plan_expires_at ?? null,
      tenant_status:    tenant?.status ?? 'active',
    }

    // 6) Feature flags (independent try/catch — features failure shouldn't break login).
    try {
      const { data: resolved } = await supabase
        .rpc('resolve_all_tenant_features', {
          p_tenant_id: activeTenantId,
          p_plan:      tenant?.plan ?? 'esencial',
        })

      if (resolved && Array.isArray(resolved)) {
        const features: Record<string, unknown> = {}
        for (const row of resolved) features[row.feature_key] = row.resolved_value
        claims.features = features
      }
    } catch {
      // Features resolution failed — continue without features in JWT.
    }

    return new Response(JSON.stringify({ claims }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    // On ANY error, return original claims to avoid breaking login.
    return new Response(JSON.stringify({ claims: existingClaims }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
