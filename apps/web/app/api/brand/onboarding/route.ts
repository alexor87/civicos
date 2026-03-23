import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Resolve tenant_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const body = await request.json()

  const {
    logo_url,
    candidate_photo_url,
    color_primary    = '#2960ec',
    color_secondary  = '#1e293b',
    color_accent     = '#ea580c',
    color_background = '#f8fafc',
    color_surface    = '#ffffff',
    slogan,
    candidate_name,
    candidate_role,
  } = body

  const { error } = await supabase
    .from('tenant_branding')
    .upsert(
      {
        tenant_id:            profile.tenant_id,
        logo_url:             logo_url             ?? null,
        candidate_photo_url:  candidate_photo_url  ?? null,
        color_primary,
        color_secondary,
        color_accent,
        color_background,
        color_surface,
        slogan:               slogan               ?? null,
        candidate_name:       candidate_name       ?? null,
        candidate_role:       candidate_role       ?? null,
        onboarding_completed: true,
      },
      { onConflict: 'tenant_id' }
    )
    .eq('tenant_id', profile.tenant_id)

  if (error) {
    console.error('[brand/onboarding] upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
