'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { callAI, AiNotConfiguredError } from '@/lib/ai/call-ai'
import { type EmailBlock } from '@/lib/email-blocks'

// ── Map Claude flat output → EmailBlock ───────────────────────────────────────

type AIBlock = { type: string; content?: string; subtext?: string; text?: string; url?: string }

function mapAIBlocks(aiBlocks: AIBlock[]): EmailBlock[] {
  return aiBlocks.map((b, i) => {
    const id = `ai-block-${i}`
    if (b.type === 'header') {
      return {
        id,
        type: 'header' as const,
        props: {
          text:       b.content ?? b.text ?? 'Titular',
          subtext:    b.subtext,
          bgColor:    '#2960ec',
          textColor:  '#ffffff',
          padding:    'md' as const,
        },
      }
    }
    if (b.type === 'button') {
      return {
        id,
        type: 'button' as const,
        props: {
          text:         b.text ?? 'Ver más',
          url:          b.url ?? '#',
          bgColor:      '#2960ec',
          textColor:    '#ffffff',
          size:         'md' as const,
          align:        'center' as const,
          borderRadius: 'sm' as const,
        },
      }
    }
    // default → text block
    return {
      id,
      type: 'text' as const,
      props: {
        content:  b.content ?? '',
        fontSize: 'md' as const,
        align:    'left' as const,
        color:    '#586069',
      },
    }
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContentType = 'email' | 'script' | 'sms' | 'talking_points' | 'speech' | 'social_post' | 'press_release'
export type ContentTone = 'formal' | 'cercano' | 'urgente'

export interface GenerateContentResult {
  // email
  subject?:  string
  blocks?:   EmailBlock[]
  // script
  script?: {
    intro:     string
    questions: string[]
    closing:   string
  }
  // sms
  sms_text?: string
  // talking_points
  points?:   string[]
  // speech
  speech?: {
    opening:    string
    body:       string[]
    closing:    string
    duration:   string
  }
  // social_post
  social_posts?: {
    twitter:   string
    instagram: string
    facebook:  string
  }
  // press_release
  press_release?: {
    headline:    string
    subheadline: string
    body:        string
    quote:       string
    boilerplate: string
  }
  // error
  error?:    string
}

// ── Tone labels ───────────────────────────────────────────────────────────────

const TONE_LABELS: Record<ContentTone, string> = {
  formal:   'formal y profesional',
  cercano:  'cercano, humano y motivacional',
  urgente:  'urgente y llamado a la acción',
}

// ── Prompts per type ──────────────────────────────────────────────────────────

function buildPrompt(
  type: ContentType,
  prompt: string,
  tone: ContentTone,
  campaign: { name: string; candidate_name?: string | null; key_topics?: string[] | null; description?: string | null }
): string {
  const toneLabel = TONE_LABELS[tone]
  const topics = Array.isArray(campaign.key_topics) && campaign.key_topics.length
    ? campaign.key_topics.join(', ')
    : 'los temas de la campaña'
  const candidate = campaign.candidate_name ?? campaign.name

  const context = `
CONTEXTO DE LA CAMPAÑA:
- Nombre: ${campaign.name}
- Candidato/a: ${candidate}
- Temas clave: ${topics}
${campaign.description ? `- Descripción: ${campaign.description}` : ''}

TONO: ${toneLabel}
SOLICITUD: ${prompt}`

  if (type === 'email') {
    return `Eres un experto en comunicaciones políticas electorales para LATAM.
Genera un email de campaña basado en la siguiente información.
${context}

Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
{
  "subject": "Asunto del email (máx 65 chars, atractivo y específico)",
  "blocks": [
    { "type": "header", "content": "Titular del email", "subtext": "Subtítulo opcional" },
    { "type": "text", "content": "Primer párrafo del cuerpo. Puede incluir {nombre} y {apellido} como variables de personalización." },
    { "type": "text", "content": "Segundo párrafo si es necesario." },
    { "type": "button", "text": "Texto del botón CTA", "url": "#" }
  ]
}`
  }

  if (type === 'script') {
    return `Eres un experto en canvassing político para LATAM.
Genera un script de conversación para voluntarios de puerta en puerta.
${context}

Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
{
  "intro": "Presentación inicial del voluntario (2-3 oraciones, max 60 palabras)",
  "questions": [
    "Pregunta abierta 1 para conocer la opinión del votante",
    "Pregunta 2 sobre temas locales relevantes",
    "Pregunta 3 sobre intención de voto o participación"
  ],
  "closing": "Cierre de la conversación y despedida (2-3 oraciones, menciona el día de elecciones)"
}`
  }

  if (type === 'sms') {
    return `Eres un experto en SMS marketing político para LATAM.
Genera un mensaje SMS de campaña.
${context}

REGLAS:
- Máximo 160 caracteres
- Puede incluir {nombre} como variable de personalización
- Debe tener un llamado a la acción claro

Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
{
  "sms_text": "El mensaje SMS completo, máx 160 chars"
}`
  }

  if (type === 'speech') {
    return `Eres un experto en oratoria política para LATAM.
Genera un discurso político estructurado para mitin o evento público.
${context}

Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
{
  "opening": "Apertura emotiva y de conexión con el público (2-3 párrafos)",
  "body": [
    "Bloque 1: propuesta principal con datos concretos",
    "Bloque 2: contraste con la situación actual",
    "Bloque 3: visión de futuro y propuestas"
  ],
  "closing": "Cierre con llamada a la acción y movilización",
  "duration": "Duración estimada en minutos (ej: '8-10 minutos')"
}`
  }

  if (type === 'social_post') {
    return `Eres un experto en comunicación digital política para LATAM.
Genera variantes de post para diferentes redes sociales.
${context}

Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
{
  "twitter": "Post para X/Twitter (máx 280 chars, incluye hashtags relevantes)",
  "instagram": "Post para Instagram (150-300 chars + emojis + 5 hashtags relevantes)",
  "facebook": "Post para Facebook (200-400 chars, más conversacional y detallado)"
}`
  }

  if (type === 'press_release') {
    return `Eres un experto en comunicaciones de prensa política para LATAM.
Genera un comunicado de prensa formal y profesional.
${context}

Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
{
  "headline": "Titular del comunicado (máx 80 chars, directo y noticioso)",
  "subheadline": "Subtítulo o entradilla (máx 120 chars)",
  "body": "Cuerpo del comunicado (3-4 párrafos: qué, quién, cuándo, dónde, por qué)",
  "quote": "Cita textual del candidato/a (1-2 oraciones impactantes)",
  "boilerplate": "Nota sobre la campaña/organización (2-3 líneas de contexto institucional)"
}`
  }

  // talking_points
  return `Eres un experto en comunicaciones políticas para LATAM.
Genera talking points para discursos, entrevistas o debate del candidato/a.
${context}

Devuelve ÚNICAMENTE este JSON (sin texto extra, sin markdown):
{
  "points": [
    "Punto 1: propuesta concreta con dato específico",
    "Punto 2: propuesta concreta con dato específico",
    "Punto 3: propuesta concreta con dato específico",
    "Punto 4: propuesta concreta con dato específico",
    "Punto 5: propuesta concreta con dato específico"
  ]
}`
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function generateContent(
  type: ContentType,
  prompt: string,
  tone: ContentTone,
): Promise<GenerateContentResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { activeTenantId, activeCampaignId } = await getActiveCampaignContext(supabase, user.id)
  const campaignId = activeCampaignId
  if (!campaignId) return { error: 'No hay campaña activa' }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, candidate_name, key_topics, description')
    .eq('id', campaignId)
    .single()

  const campaignContext = {
    name:           campaign?.name ?? 'Campaña',
    candidate_name: campaign?.candidate_name ?? null,
    key_topics:     campaign?.key_topics ?? null,
    description:    campaign?.description ?? null,
  }

  const builtPrompt = buildPrompt(type, prompt, tone, campaignContext)

  try {
    const adminSupabase = createAdminClient()
    const aiResult = await callAI(
      adminSupabase,
      activeTenantId!,
      campaignId,
      [{ role: 'user', content: builtPrompt }],
      { maxTokens: 2048 },
    )

    const text = (aiResult.content || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const parsed = JSON.parse(text)

    if (type === 'email') {
      return {
        subject: parsed.subject ?? '',
        blocks:  mapAIBlocks(parsed.blocks ?? []),
      }
    }

    if (type === 'script') {
      return { script: parsed }
    }

    if (type === 'sms') {
      return { sms_text: parsed.sms_text ?? '' }
    }

    if (type === 'speech') {
      return { speech: parsed }
    }

    if (type === 'social_post') {
      return { social_posts: parsed }
    }

    if (type === 'press_release') {
      return { press_release: parsed }
    }

    // talking_points
    return { points: parsed.points ?? [] }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `No se pudo generar el contenido: ${msg}` }
  }
}
