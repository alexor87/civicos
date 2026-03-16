import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.78.0'

// Agent 6 — Generación de Contenido de Campaña
// Trigger: explicit HTTP POST from UI (Campaign Manager or Field Coordinator)
// Auth: Supabase JWT in Authorization header
// Generates: speeches, canvassing scripts, social posts, email drafts, SMS drafts
// Result: content returned immediately + saved in agent_runs

const AGENT_ID = 'agent-content-gen'
const WORKFLOW_ID = 'content-gen-v1'

const CONTENT_TYPES: Record<string, { label: string; prompt: string; maxTokens: number }> = {
  speech: {
    label: 'Discurso',
    prompt: 'Genera un discurso político conciso y persuasivo para mitin o evento público.',
    maxTokens: 2000,
  },
  canvassing_script: {
    label: 'Script de Canvassing',
    prompt: 'Genera un script de conversación puerta a puerta: apertura, presentación, respuesta a objeciones comunes, y cierre.',
    maxTokens: 1500,
  },
  social_post: {
    label: 'Post Redes Sociales',
    prompt: 'Genera 3 variantes de post para redes sociales (Twitter/X, Instagram, Facebook). Cada variante adaptada al tono de la red.',
    maxTokens: 800,
  },
  email_draft: {
    label: 'Borrador de Email',
    prompt: 'Genera un borrador de email de campaña con asunto, cuerpo y llamada a la acción.',
    maxTokens: 1200,
  },
  sms_draft: {
    label: 'Borrador de SMS',
    prompt: 'Genera 3 variantes de SMS de campaña (máximo 160 caracteres cada uno). Directo, claro y con llamada a la acción.',
    maxTokens: 400,
  },
  press_release: {
    label: 'Comunicado de Prensa',
    prompt: 'Genera un comunicado de prensa formal con estructura estándar: titular, subtítulo, cuerpo, cita del candidato, y boilerplate.',
    maxTokens: 1800,
  },
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  // Auth: verify Supabase JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Verify token
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Parse body
  let body: {
    campaign_id: string
    content_type: string
    topic?: string
    tone?: string
    target_audience?: string
    key_messages?: string[]
    additional_context?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { campaign_id, content_type, topic, tone, target_audience, key_messages, additional_context } = body

  if (!campaign_id || !content_type) {
    return new Response(JSON.stringify({ error: 'campaign_id and content_type are required' }), { status: 400 })
  }

  const contentConfig = CONTENT_TYPES[content_type]
  if (!contentConfig) {
    return new Response(JSON.stringify({
      error: `Invalid content_type. Valid types: ${Object.keys(CONTENT_TYPES).join(', ')}`,
    }), { status: 400 })
  }

  // Fetch campaign settings for tone/values
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name, id, tenant_id')
    .eq('id', campaign_id)
    .single()

  if (!campaign) {
    return new Response(JSON.stringify({ error: 'Campaign not found' }), { status: 404 })
  }

  const { data: settings } = await supabase
    .from('campaign_settings')
    .select('candidate_name, party_name, main_issues, tone_keywords, target_demographic')
    .eq('campaign_id', campaign_id)
    .single()

  const claude = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

  // Log run start
  const { data: runData } = await supabase
    .from('agent_runs')
    .insert({
      tenant_id: campaign.tenant_id,
      campaign_id,
      agent_id: AGENT_ID,
      workflow_id: WORKFLOW_ID,
      status: 'running',
      trigger: `ui_request:${user.id}`,
      steps: [],
    })
    .select()
    .single()

  const runId = runData?.id

  try {
    const systemPrompt = `Eres un experto en comunicación política y copywriting de campañas electorales.
Generas contenido en español, adaptado al tono y valores de la campaña.
${settings?.candidate_name ? `Candidato: ${settings.candidate_name}` : ''}
${settings?.party_name ? `Partido/Movimiento: ${settings.party_name}` : ''}
${settings?.main_issues?.length ? `Temas principales: ${settings.main_issues.join(', ')}` : ''}
${settings?.tone_keywords?.length ? `Tono y estilo: ${settings.tone_keywords.join(', ')}` : ''}
${settings?.target_demographic ? `Público objetivo: ${settings.target_demographic}` : ''}

Importante: el contenido debe ser auténtico, no exagerado, y alineado con los valores de la campaña.`

    const userPrompt = `${contentConfig.prompt}

Campaña: ${campaign.name}
${topic ? `Tema/Contexto: ${topic}` : ''}
${tone ? `Tono deseado: ${tone}` : ''}
${target_audience ? `Audiencia específica: ${target_audience}` : ''}
${key_messages?.length ? `Mensajes clave a incluir:\n${key_messages.map(m => `- ${m}`).join('\n')}` : ''}
${additional_context ? `Contexto adicional: ${additional_context}` : ''}

Genera el contenido en formato estructurado y listo para usar.`

    const response = await claude.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: contentConfig.maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const generatedContent = response.content[0].type === 'text'
      ? response.content[0].text
      : ''

    // Save completed run
    await supabase
      .from('agent_runs')
      .update({
        status: 'completed',
        steps: [{ step: 'generate_content', content_type, completed_at: new Date().toISOString() }],
        result: {
          content_type,
          content_label: contentConfig.label,
          topic,
          content: generatedContent,
          tokens_used: response.usage.output_tokens,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        content_type,
        content_label: contentConfig.label,
        content: generatedContent,
        tokens_used: response.usage.output_tokens,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error'

    await supabase
      .from('agent_runs')
      .update({ status: 'failed', error: errMsg, completed_at: new Date().toISOString() })
      .eq('id', runId)

    return new Response(JSON.stringify({ error: errMsg }), { status: 500 })
  }
})
