import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAI, AiNotConfiguredError } from '../_shared/ai-router.ts'

// Agent 1 — Welcome & Contact Qualification
// Trigger: INSERT on contacts table (via Supabase webhook)

const AGENT_ID = 'agent-welcome-contact'
const WORKFLOW_ID = 'welcome-v1'

Deno.serve(async (req: Request) => {
  const body = await req.json()

  // Supabase webhook payload
  const contact = body.record
  if (!contact) {
    return new Response(JSON.stringify({ error: 'No record in payload' }), { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Log agent run start
  const { data: runData } = await supabase
    .from('agent_runs')
    .insert({
      tenant_id: contact.tenant_id,
      campaign_id: contact.campaign_id,
      agent_id: AGENT_ID,
      workflow_id: WORKFLOW_ID,
      status: 'running',
      trigger: `contact_created:${contact.id}`,
      steps: [],
    })
    .select()
    .single()

  const runId = runData?.id
  const steps: unknown[] = []

  try {
    // Step 1: Analyze contact and generate classification
    steps.push({ step: 'analyze', started_at: new Date().toISOString() })

    const aiResult = await callAI(
      supabase,
      contact.tenant_id,
      contact.campaign_id,
      [
        {
          role: 'user',
          content: `Analiza este nuevo contacto en la campaña:
Nombre: ${contact.first_name} ${contact.last_name}
Email: ${contact.email || 'No disponible'}
Teléfono: ${contact.phone || 'No disponible'}
Ciudad: ${contact.city || 'No disponible'}
Distrito: ${contact.district || 'No disponible'}
Tags actuales: ${contact.tags?.join(', ') || 'Ninguno'}
Estado inicial: ${contact.status}
Notas: ${contact.notes || 'Ninguna'}`,
        },
      ],
      {
        maxTokens: 1024,
        system: `Eres un asistente de campaña electoral inteligente.
Analiza el perfil de un nuevo contacto y:
1. Sugiere tags relevantes basados en su perfil (máximo 5 tags)
2. Evalúa su potencial de simpatizante (alto/medio/bajo)
3. Sugiere el canal de bienvenida más apropiado
4. Genera un mensaje de bienvenida personalizado y breve (máximo 160 caracteres para SMS)
Responde SOLO en JSON con esta estructura exacta:
{"tags": [], "potential": "alto|medio|bajo", "channel": "sms|email", "welcome_message": "...", "is_high_value": false, "reasoning": "..."}`,
      },
    )

    const analysisText = aiResult.content || '{}'

    let analysis: {
      tags: string[]
      potential: string
      channel: string
      welcome_message: string
      is_high_value: boolean
      reasoning: string
    }

    try {
      analysis = JSON.parse(analysisText)
    } catch {
      analysis = {
        tags: [],
        potential: 'medio',
        channel: contact.email ? 'email' : 'sms',
        welcome_message: `Hola ${contact.first_name}, bienvenido a nuestra campaña. ¡Tu apoyo es importante!`,
        is_high_value: false,
        reasoning: 'Análisis no disponible',
      }
    }

    steps.push({ step: 'analyze', completed_at: new Date().toISOString(), result: analysis })

    // Step 2: Update contact tags
    if (analysis.tags?.length > 0) {
      await supabase
        .from('contacts')
        .update({ tags: [...(contact.tags || []), ...analysis.tags] })
        .eq('id', contact.id)

      steps.push({ step: 'update_tags', tags: analysis.tags, completed_at: new Date().toISOString() })
    }

    // Step 3: Create AI suggestion
    const suggestionData: Record<string, unknown> = {
      tenant_id: contact.tenant_id,
      campaign_id: contact.campaign_id,
      type: 'contact_welcome',
      module: 'crm',
      priority: analysis.is_high_value ? 'high' : 'medium',
      title: `Nuevo contacto: ${contact.first_name} ${contact.last_name}`,
      description: `Contacto clasificado como potencial ${analysis.potential}. ${analysis.reasoning}`,
      reasoning: analysis.reasoning,
      estimated_impact: `Potencial de conversión: ${analysis.potential}`,
      action_payload: {
        contact_id: contact.id,
        welcome_message: analysis.welcome_message,
        channel: analysis.channel,
        suggested_tags: analysis.tags,
      },
      agent_id: AGENT_ID,
      status: analysis.is_high_value ? 'pending_approval' : 'active',
    }

    await supabase.from('ai_suggestions').insert(suggestionData)

    steps.push({ step: 'create_suggestion', completed_at: new Date().toISOString() })

    // Update agent run as completed
    if (runId) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          steps,
          result: { analysis, contact_id: contact.id },
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error'

    if (runId) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'failed',
          steps,
          error: errMsg,
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    return new Response(JSON.stringify({ error: errMsg }), { status: 500 })
  }
})
