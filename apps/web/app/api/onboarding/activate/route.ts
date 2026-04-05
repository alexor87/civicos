import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  const body = await request.json()
  const { electionType, candidateName } = body

  if (!electionType || !candidateName) {
    return NextResponse.json({ error: 'Cargo y candidato son requeridos' }, { status: 400 })
  }

  const adminSupabase = await createAdminClient()

  // Submit activation request for admin approval
  const { error: rpcError } = await adminSupabase.rpc('request_campaign_activation', {
    p_tenant_id: profile.tenant_id,
    p_wizard_data: body,
  })

  if (rpcError) {
    return NextResponse.json(
      { error: 'Error al enviar la solicitud: ' + rpcError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, status: 'pending_approval' })
}
