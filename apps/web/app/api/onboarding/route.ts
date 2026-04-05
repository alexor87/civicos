import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { orgName, email, password } = await request.json()

  if (!orgName || !email || !password) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // 1. Generate slug from org name
  const baseSlug = orgName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 40)

  // Ensure uniqueness by appending random suffix
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

  // 2. Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name: orgName, slug, plan: 'pro', settings: { country: 'colombia' } })
    .select()
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Error al crear la organización' }, { status: 500 })
  }

  // 3. Seed tenant_branding (onboarding_completed = false → wizard shows after activation)
  await supabase.from('tenant_branding').insert({
    tenant_id: tenant.id,
    onboarding_completed: false,
  })

  // 4. Create auth user
  const fullName = orgName // Use org name as placeholder until branding wizard
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      tenant_id: tenant.id,
      role: 'super_admin',
    },
  })

  if (authError || !authData.user) {
    // Cleanup on failure
    await supabase.from('tenant_branding').delete().eq('tenant_id', tenant.id)
    await supabase.from('tenants').delete().eq('id', tenant.id)
    return NextResponse.json({ error: authError?.message || 'Error al crear usuario' }, { status: 500 })
  }

  // 5. Upsert profile (no campaign_ids yet — seed will set them)
  await supabase.from('profiles').upsert({
    id: authData.user.id,
    tenant_id: tenant.id,
    role: 'super_admin',
    full_name: fullName,
    campaign_ids: [],
  })

  // 6. Create onboarding_state
  await supabase.from('onboarding_state').insert({
    tenant_id: tenant.id,
    stage: 'pending',
  })

  // 7. Fire-and-forget: invoke seed-demo-campaign Edge Function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (supabaseUrl && serviceRoleKey) {
    fetch(`${supabaseUrl}/functions/v1/seed-demo-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        tenant_id: tenant.id,
        user_id: authData.user.id,
      }),
    }).catch(() => {
      // Fire-and-forget — seed failure is non-fatal
    })
  }

  return NextResponse.json({
    success: true,
    tenantId: tenant.id,
  })
}
