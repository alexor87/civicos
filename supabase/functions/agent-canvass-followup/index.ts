import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.78.0'

// Agent 2 — Canvassing Follow-up
// Trigger: INSERT/UPDATE on canvass_visits where result IN ('no_home', 'follow_up')

const AGENT_ID = 'agent-canvass-followup'
const WORKFLOW_ID = 'canvass-followup-v1'
const MAX_ATTEMPTS_BEFORE_CHANNEL_SWITCH = 3

Deno.serve(async (req: Request) => {
  const body = await req.json()
  const visit = body.record

  if (!visit) {
    return new Response(JSON.stringify({ error: 'No record in payload' }), { status: 400 })
  }

  // Only process no_home and follow_up results
  if (!['no_home', 'follow_up'].includes(visit.result)) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const claude = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  // Log agent run
  const { data: runData } = await supabase
    .from('agent_runs')
    .insert({
      tenant_id: visit.tenant_id,
      campaign_id: visit.campaign_id,
      agent_id: AGENT_ID,
      workflow_id: WORKFLOW_ID,
      status: 'running',
      trigger: `visit_result:${visit.result}:${visit.id}`,
      steps: [],
    })
    .select()
    .single()

  const runId = runData?.id
  const steps: unknown[] = []

  try {
    // Get contact info
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', visit.contact_id)
      .single()

    // Count previous failed attempts
    const { count: failedAttempts } = await supabase
      .from('canvass_visits')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', visit.contact_id)
      .in('result', ['no_home', 'follow_up', 'refused'])

    steps.push({
      step: 'analyze_context',
      contact_id: visit.contact_id,
      failed_attempts: failedAttempts,
      completed_at: new Date().toISOString(),
    })

    // Generate recommendation with Claude
    const analysisResponse = await claude.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      system: `Eres un coordinador de campaña experto. Analiza los intentos de visita fallidos y recomienda la mejor acción.
Responde SOLO en JSON:
{"action": "retry_visit|switch_channel|escalate", "recommended_channel": "phone|sms|email", "best_time": "mañana|tarde|noche", "message_draft": "...", "priority": "high|medium|low", "reasoning": "..."}`,
      messages: [
        {
          role: 'user',
          content: `Visita de canvassing fallida:
Resultado: ${visit.result}
Intentos fallidos totales: ${failedAttempts}
Contacto: ${contact?.first_name} ${contact?.last_name}
Email disponible: ${contact?.email ? 'Sí' : 'No'}
Teléfono disponible: ${contact?.phone ? 'Sí' : 'No'}
Ciudad: ${contact?.city || 'Desconocida'}
Notas de la visita: ${visit.notes || 'Sin notas'}`,
        },
      ],
    })

    const analysisText = analysisResponse.content[0].type === 'text'
      ? analysisResponse.content[0].text
      : '{}'

    let recommendation: {
      action: string
      recommended_channel: string
      best_time: string
      message_draft: string
      priority: string
      reasoning: string
    }

    try {
      recommendation = JSON.parse(analysisText)
    } catch {
      recommendation = {
        action: (failedAttempts ?? 0) >= MAX_ATTEMPTS_BEFORE_CHANNEL_SWITCH ? 'switch_channel' : 'retry_visit',
        recommended_channel: 'phone',
        best_time: 'tarde',
        message_draft: `Hola ${contact?.first_name}, nos gustaría hablar contigo sobre nuestra campaña.`,
        priority: 'medium',
        reasoning: 'Múltiples intentos fallidos de visita presencial.',
      }
    }

    steps.push({
      step: 'generate_recommendation',
      recommendation,
      completed_at: new Date().toISOString(),
    })

    // Create HITL suggestion for coordinator
    await supabase.from('ai_suggestions').insert({
      tenant_id: visit.tenant_id,
      campaign_id: visit.campaign_id,
      type: 'canvass_followup',
      module: 'canvassing',
      priority: (failedAttempts ?? 0) >= MAX_ATTEMPTS_BEFORE_CHANNEL_SWITCH ? 'high' : recommendation.priority as 'high' | 'medium' | 'low',
      title: `Seguimiento requerido: ${contact?.first_name} ${contact?.last_name}`,
      description: `${failedAttempts} intento(s) fallido(s). ${recommendation.reasoning}`,
      reasoning: recommendation.reasoning,
      estimated_impact: 'Recuperación de contacto con potencial de conversión',
      action_payload: {
        contact_id: visit.contact_id,
        visit_id: visit.id,
        recommendation,
        failed_attempts: failedAttempts,
      },
      agent_id: AGENT_ID,
      status: 'pending_approval', // Always HITL for canvassing actions
    })

    steps.push({ step: 'create_hitl_suggestion', completed_at: new Date().toISOString() })

    if (runId) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          steps,
          result: { recommendation, contact_id: visit.contact_id },
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    return new Response(JSON.stringify({ success: true, recommendation }), {
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
