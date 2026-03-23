import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_ROLES = ['super_admin', 'campaign_manager']

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  if (!ALLOWED_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()

  // Build update payload from whichever fields are present
  const updates: Record<string, unknown> = {}
  const allowed = [
    'logo_url', 'candidate_photo_url',
    'color_primary', 'color_secondary', 'color_accent', 'color_background', 'color_surface',
    'slogan', 'candidate_name', 'candidate_role',
  ]
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { error } = await supabase
    .from('tenant_branding')
    .upsert(
      { tenant_id: profile.tenant_id, ...updates },
      { onConflict: 'tenant_id' }
    )

  if (error) {
    console.error('[settings/brand] upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
