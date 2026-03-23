import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { TRIGGER_CONFIG, ACTION_CONFIG, renderVariables } from '@/components/dashboard/flows/flowTypes'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `Eres un asistente experto en automatizaciones para campañas electorales en Colombia.
El usuario describe en lenguaje natural lo que quiere automatizar.
Tu tarea es interpretar su intención y construir la configuración JSON completa del Flow.

TRIGGERS DISPONIBLES:
${JSON.stringify(TRIGGER_CONFIG, null, 2)}

ACCIONES DISPONIBLES:
${JSON.stringify(ACTION_CONFIG, null, 2)}

REGLAS:
- Responde SOLO con un JSON válido, sin markdown, sin explicaciones adicionales.
- El campo "message" de send_whatsapp debe usar las variables: {first_name}, {full_name}, {barrio}, {municipio}, {candidate_name}
- Si el usuario menciona cumpleaños → usa trigger date_field con field: "birth_date"
- Si el usuario menciona inactividad o "no contactado" → usa trigger inactivity
- Si el usuario menciona nueva persona o nuevo contacto → usa trigger contact_created
- Si el usuario menciona donante o "quiere donar" → usa trigger canvass_result con result: "wants_to_donate"
- Si el usuario menciona simpatizante o "cambio de simpatía" → usa trigger sympathy_change
- Si el usuario menciona "responde", "contestó", "reply" → usa trigger contact_replied
- Si el usuario menciona "antes del evento", "días antes de", "evento del calendario" → usa trigger calendar_date
- Si el usuario menciona "esperar", "después de X días", "pausa" → usa acción wait
- Si el usuario menciona "correo", "email" → usa acción send_email
- Si el usuario menciona "SMS", "texto" → usa acción send_sms
- Si el usuario menciona "crear evento", "agendar", "calendario" → usa acción create_calendar_event
- Si el usuario menciona "cambiar simpatía", "actualizar nivel", "subir nivel" → usa acción change_sympathy
- El campo clarifying_questions debe ser un array de strings con preguntas de aclaración en español si la descripción es ambigua (máximo 2 preguntas). Si la descripción es clara, devuelve un array vacío.

FORMATO DE RESPUESTA (JSON puro):
{
  "name": "Nombre descriptivo del Flow en español",
  "category": "birthday | engagement | canvassing | comms | electoral | sympathy | donations | custom",
  "icon": "emoji representativo",
  "trigger_config": { "type": "...", "config": { ... } },
  "filter_config": [],
  "actions_config": [ { "type": "...", "config": { ... } } ],
  "human_summary": "Descripción en lenguaje natural de qué hace el Flow, máximo 2 oraciones",
  "clarifying_questions": []
}`

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('campaign_ids, tenant_id')
      .eq('id', user.id)
      .single()
    const campaignId = profile?.campaign_ids?.[0]
    if (!campaignId) return NextResponse.json({ error: 'No campaign' }, { status: 400 })

    const { naturalLanguageInput } = await req.json()
    if (!naturalLanguageInput?.trim()) {
      return NextResponse.json({ error: 'naturalLanguageInput es requerido' }, { status: 400 })
    }

    // Obtener nombre del candidato para el contexto
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('name, candidate_name')
      .eq('id', campaignId)
      .single()

    const candidateName = (campaign as { candidate_name?: string } | null)?.candidate_name
      ?? (campaign as { name?: string } | null)?.name
      ?? 'el candidato'

    // Llamar a Claude
    const response = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: naturalLanguageInput }],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    let flowConfig: Record<string, unknown>
    try {
      // Extraer JSON del texto (puede venir con markdown)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      flowConfig = JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
    } catch {
      return NextResponse.json({ error: 'La IA generó una respuesta inválida. Intenta de nuevo.' }, { status: 500 })
    }

    // Obtener contacto de preview
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, full_name, neighborhood_name, municipality_name')
      .eq('campaign_id', campaignId)
      .not('full_name', 'is', null)
      .limit(5)

    const previewContact = contacts?.[0] ?? null

    // Renderizar mensaje de preview
    let renderedMessage: string | null = null
    const firstAction = (flowConfig.actions_config as Array<{ type: string; config: { message?: string } }>)?.[0]
    if (firstAction?.type === 'send_whatsapp' && firstAction.config.message && previewContact) {
      renderedMessage = renderVariables(
        firstAction.config.message,
        {
          full_name:         previewContact.full_name,
          neighborhood_name: previewContact.neighborhood_name,
          municipality_name: previewContact.municipality_name,
        },
        candidateName
      )
    }

    return NextResponse.json({
      flowConfig,
      previewContact: previewContact ? {
        id:        previewContact.id,
        name:      previewContact.full_name,
        barrio:    previewContact.neighborhood_name,
        municipio: previewContact.municipality_name,
      } : null,
      renderedMessage,
    })
  } catch (e) {
    console.error('[POST /api/flows/generate]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
