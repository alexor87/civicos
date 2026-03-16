import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderVariables } from '@/components/dashboard/flows/flowTypes'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('campaign_id')
      .eq('id', user.id)
      .single()
    if (!profile?.campaign_id) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const message  = searchParams.get('message') ?? ''
    const skipId   = searchParams.get('skip')   // id del contacto a omitir (para "Ver otro ejemplo")

    let query = supabase
      .from('contacts')
      .select('id, full_name, neighborhood_name, municipality_name')
      .eq('campaign_id', profile.campaign_id)
      .not('full_name', 'is', null)
      .limit(10)

    if (skipId) {
      query = query.neq('id', skipId)
    }

    const { data: contacts } = await query
    const contact = contacts?.[0] ?? null

    if (!contact) {
      return NextResponse.json({ contact: null, renderedMessage: message })
    }

    // Obtener nombre del candidato
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name, candidate_name')
      .eq('id', profile.campaign_id)
      .single()

    const candidateName = (campaign as { candidate_name?: string } | null)?.candidate_name
      ?? (campaign as { name?: string } | null)?.name
      ?? 'el candidato'

    const renderedMessage = renderVariables(
      message,
      {
        full_name:         contact.full_name,
        neighborhood_name: contact.neighborhood_name,
        municipality_name: contact.municipality_name,
      },
      candidateName
    )

    return NextResponse.json({
      contact: {
        id:        contact.id,
        name:      contact.full_name,
        barrio:    contact.neighborhood_name,
        municipio: contact.municipality_name,
      },
      renderedMessage,
    })
  } catch (e) {
    console.error('[GET /api/flows/preview]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
