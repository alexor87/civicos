import { createAdminClient } from '@/lib/supabase/server'
import { sendVerificationEmail } from '@/lib/email/send-verification-email'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const onboardingSchema = z.object({
  orgName: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña mínimo 8 caracteres').max(100),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 }) }

  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }
  const { orgName, email, password } = parsed.data

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
    email_confirm: false,
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
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
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

  // 8. Send verification email via Resend (non-fatal — user can resend from /verify-email)
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.scrutix.co'
  // Use magiclink: the user already exists (createUser above), so 'signup' type
  // would fail with "User already registered". Magiclink works for existing
  // unconfirmed users — clicking confirms the email AND creates a session.
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${siteUrl}/auth/callback?next=/welcome` },
  })
  if (linkError) {
    console.error('[onboarding] generateLink failed:', linkError.message)
  }
  const hashedToken = linkData?.properties?.hashed_token
  if (hashedToken) {
    const actionLink = `${siteUrl}/auth/callback?token_hash=${hashedToken}&type=magiclink&next=/welcome`
    const result = await sendVerificationEmail({ email, actionLink })
    if (!result.ok) {
      console.error('[onboarding] sendVerificationEmail failed:', result.error)
    }
  }

  return NextResponse.json({
    success: true,
    tenantId: tenant.id,
  })
}
