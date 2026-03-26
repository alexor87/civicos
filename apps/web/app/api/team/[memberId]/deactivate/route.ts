import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!['super_admin', 'campaign_manager'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Cannot deactivate yourself
  if (memberId === user.id) {
    return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 })
  }

  // Verify same tenant
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', memberId)
    .single()

  if (!targetProfile || targetProfile.tenant_id !== profile?.tenant_id) {
    return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
  }

  // Deactivate by clearing campaign_ids (effectively removes access)
  const { error } = await supabase
    .from('profiles')
    .update({ campaign_ids: [], role: 'volunteer' })
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
