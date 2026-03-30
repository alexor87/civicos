'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'
import { type ContentTone } from '@/app/dashboard/contenido/generate-action'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OptimalSend {
  day_of_week: string
  hour:        number
  rationale:   string
  confidence:  'high' | 'medium' | 'low'
}

export interface SubjectVariant {
  variant: string
  tone:    string
  why:     string
}

export interface ReengagementInfo {
  count:               number
  segment_description: string
  suggested_message:   string
}

export interface SmartCommsReport {
  optimal_send:     OptimalSend | null
  subject_variants: SubjectVariant[]
  reengagement:     ReengagementInfo | null
  generated_at:     string
}

export interface SmartCommsResult {
  report?: SmartCommsReport
  error?:  string
}

// ── Main action ───────────────────────────────────────────────────────────────

export async function analyzeSmartComms(
  topic?: string,
  tone?: ContentTone,
): Promise<SmartCommsResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const campaignId = profile?.campaign_ids?.[0]
  if (!campaignId) return { error: 'No hay campaña activa' }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, candidate_name, key_topics')
    .eq('id', campaignId)
    .single()

  const now     = new Date()
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // ── Fetch data in parallel ─────────────────────────────────────────────────

  const [emailCampsRes, staleContactsRes] = await Promise.all([
    supabase
      .from('email_campaigns')
      .select('id, subject, sent_at, recipient_count, status')
      .eq('campaign_id', campaignId)
      .order('sent_at', { ascending: false })
      .limit(10),
    supabase
      .from('contacts')
      .select('id')
      .eq('campaign_id', campaignId)
      .lt('created_at', since30d),
  ])

  const emailCamps    = (emailCampsRes.data ?? []).filter(c => c.sent_at)
  const staleContacts = staleContactsRes.data ?? []

  // Extract send-time patterns
  const sentTimes = emailCamps
    .filter(c => c.sent_at)
    .map(c => {
      const d = new Date(c.sent_at!)
      return { hour: d.getUTCHours(), dow: d.getUTCDay(), subject: c.subject, recipients: c.recipient_count ?? 0 }
    })

  // ── Build prompt ───────────────────────────────────────────────────────────

  const topicLine = topic
    ? `\nTEMA PARA VARIANTES DE ASUNTO: "${topic}" (tono: ${tone ?? 'cercano'})`
    : '\nTEMA PARA VARIANTES DE ASUNTO: genera variantes genéricas de alta conversión para la campaña'

  const prompt = `Analiza las comunicaciones de email de la campaña "${campaign?.name ?? campaignId}" y genera recomendaciones inteligentes.

CAMPAÑAS DE EMAIL ENVIADAS (últimas 10):
${sentTimes.length > 0
  ? sentTimes.map(t => `- Día ${t.dow} (0=dom,1=lun…6=sáb), hora ${t.hour}:00 UTC → "${t.subject}" → ${t.recipients} destinatarios`).join('\n')
  : '- Sin campañas previas (recomienda horario óptimo genérico para audiencia política LATAM)'}
${topicLine}

CONTACTOS SIN ACTIVIDAD >30 DÍAS: ${staleContacts.length}
CANDIDATO: ${(campaign as { candidate_name?: string } | null)?.candidate_name ?? 'Sin especificar'}
TEMAS CLAVE: ${(campaign as { key_topics?: string } | null)?.key_topics ?? 'Sin especificar'}

Genera recomendaciones:
1. Horario óptimo de envío basado en patrones históricos (o mejores prácticas si no hay datos)
2. Tres variantes de asunto de email para el tema indicado
3. Estrategia de reengagement para contactos inactivos

Devuelve ÚNICAMENTE este JSON (sin texto extra):
{
  "optimal_send": {
    "day_of_week": "martes",
    "hour": 19,
    "rationale": "Explicación breve de por qué este horario",
    "confidence": "high|medium|low"
  },
  "subject_variants": [
    { "variant": "Asunto de email variante 1", "tone": "motivacional", "why": "Por qué funciona" },
    { "variant": "Asunto de email variante 2", "tone": "urgente", "why": "Por qué funciona" },
    { "variant": "Asunto de email variante 3", "tone": "informativo", "why": "Por qué funciona" }
  ],
  "reengagement": {
    "count": ${staleContacts.length},
    "segment_description": "Descripción del segmento de contactos inactivos",
    "suggested_message": "Primer mensaje sugerido para reactivar estos contactos (usa {nombre})"
  }
}`

  // ── Call Claude ────────────────────────────────────────────────────────────

  try {
    const adminSupabase = createAdminClient()
    const aiResult = await callAI(
      adminSupabase,
      profile.tenant_id,
      campaignId,
      [{ role: 'user', content: prompt }],
      { maxTokens: 1024 },
    )

    const text = aiResult.content || ''
    const parsed = JSON.parse(text)

    const report: SmartCommsReport = {
      optimal_send:     parsed.optimal_send     ?? null,
      subject_variants: parsed.subject_variants ?? [],
      reengagement:     parsed.reengagement     ?? null,
      generated_at:     now.toISOString(),
    }

    // Log to agent_runs
    await supabase.from('agent_runs').insert({
      campaign_id:  campaignId,
      agent_id:     'smart-comms-v1',
      workflow_id:  'smart-comms-analysis',
      status:       'completed',
      trigger:      'on_demand',
      result:       report,
      started_at:   now.toISOString(),
      completed_at: new Date().toISOString(),
    })

    return { report }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `No se pudo analizar las comunicaciones: ${msg}` }
  }
}
