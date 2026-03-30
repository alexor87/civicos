import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { messages, campaign_id } = body as { messages: ChatMessage[]; campaign_id: string }

  if (!messages?.length || !campaign_id) {
    return NextResponse.json({ error: 'Missing messages or campaign_id' }, { status: 400 })
  }

  const campaignIds: string[] = profile.campaign_ids ?? []
  if (profile.role !== 'super_admin' && !campaignIds.includes(campaign_id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Load campaign context
  const [
    { data: campaign },
    { data: suggestions },
    { data: agentRuns },
    { count: totalContacts },
    { count: supporters },
    { count: visits24h },
  ] = await Promise.all([
    supabase.from('campaigns').select('name, election_date').eq('id', campaign_id).single(),
    supabase.from('ai_suggestions').select('priority, title, description').eq('campaign_id', campaign_id).in('status', ['active', 'pending_approval']).order('created_at', { ascending: false }).limit(5),
    supabase.from('agent_runs').select('agent_id, status, trigger').eq('campaign_id', campaign_id).order('created_at', { ascending: false }).limit(3),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign_id),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign_id).eq('status', 'supporter'),
    supabase.from('canvass_visits').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign_id).gte('created_at', new Date(Date.now() - 86_400_000).toISOString()),
  ])

  const supportRate = totalContacts ? Math.round(((supporters ?? 0) / totalContacts) * 100) : 0
  const daysToElection = campaign?.election_date
    ? Math.ceil((new Date(campaign.election_date).getTime() - Date.now()) / 86_400_000)
    : null

  const suggestionsSummary = (suggestions ?? [])
    .map(s => `- [${s.priority}] ${s.title}: ${s.description}`)
    .join('\n') || '- Sin sugerencias activas'

  const agentRunsSummary = (agentRuns ?? [])
    .map(r => `- ${r.agent_id}: ${r.status} (${r.trigger})`)
    .join('\n') || '- Sin actividad reciente'

  const systemPrompt = `Eres el asistente de inteligencia de campaña para CivicOS. Ayudas al equipo de campaña a tomar decisiones estratégicas basadas en datos.

CONTEXTO DE CAMPAÑA:
- Campaña: ${campaign?.name ?? 'Sin nombre'}
- Fecha de elección: ${campaign?.election_date ?? 'No definida'}${daysToElection !== null ? ` (${daysToElection} días)` : ''}
- Contactos totales: ${totalContacts ?? 0}
- Simpatizantes: ${supporters ?? 0} (${supportRate}%)
- Visitas últimas 24h: ${visits24h ?? 0}

SUGERENCIAS ACTIVAS:
${suggestionsSummary}

ÚLTIMA ACTIVIDAD DE AGENTES:
${agentRunsSummary}

Responde siempre en español. Sé conciso, directo y enfócate en acciones concretas para mejorar la campaña. Si no tienes datos suficientes para responder algo, dilo claramente.`

  try {
    const adminSupabase = createAdminClient()
    const aiResult = await callAI(adminSupabase, profile.tenant_id, campaign_id,
      messages.map(m => ({ role: m.role, content: m.content })),
      { system: systemPrompt, maxTokens: 1024 }
    )

    const responseText = aiResult.content || ''

    return new Response(responseText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
