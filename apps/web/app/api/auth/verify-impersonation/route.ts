import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    // 1. Verify JWT
    const secret = new TextEncoder().encode(process.env.IMPERSONATION_SECRET!)
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'scrutix-admin',
      audience: 'scrutix-web',
    })

    // 2. Validate impersonation flag
    if (payload.is_impersonation !== true) {
      return NextResponse.json(
        { error: 'Token no es de impersonación' },
        { status: 400 }
      )
    }

    // 3. Create admin client for privileged operations
    const adminSupabase = createAdminClient()

    // 4. Get super admin profile
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('id, full_name, tenant_id')
      .eq('id', payload.sub)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // 5. Get user email from auth
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.getUserById(
      payload.sub as string
    )

    if (authError || !authUser?.user?.email) {
      return NextResponse.json(
        { error: 'No se pudo obtener email del usuario' },
        { status: 404 }
      )
    }

    const userEmail = authUser.user.email

    // 6. Generate magic link
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
      options: { redirectTo: '/dashboard' },
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json(
        { error: 'No se pudo generar enlace de sesión' },
        { status: 500 }
      )
    }

    // 7. Extract hashed_token
    const hashedToken = linkData.properties.hashed_token

    // 8. Create SSR client with cookie handling
    const ssrSupabase = await createClient()

    // 9. Verify OTP to establish session as impersonated user
    const { error: otpError } = await ssrSupabase.auth.verifyOtp({
      token_hash: hashedToken,
      type: 'magiclink',
    })

    if (otpError) {
      return NextResponse.json(
        { error: 'No se pudo establecer sesión' },
        { status: 500 }
      )
    }

    // 10. Return impersonation metadata (client saves to sessionStorage)
    const impersonationData = {
      admin_id: payload.admin_id as string,
      admin_email: payload.impersonated_by as string,
      tenant_id: payload.tenant_id as string,
      tenant_name: payload.tenant_name as string,
      session_id: payload.impersonation_session_id as string,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }

    return NextResponse.json(impersonationData)
  } catch {
    return NextResponse.json(
      { error: 'Token inválido o expirado' },
      { status: 401 }
    )
  }
}
