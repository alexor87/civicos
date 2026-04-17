import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'
import { sanitizeForPrompt, sanitizeTagsForPrompt } from '@/lib/security/sanitize'
import { checkAgentRateLimit } from '@/lib/agent-rate-limit'

// Simple in-memory cache keyed by contactId
const cache = new Map<string, { data: unknown; expiresAt: number }>()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const wantPlan = req.nextUrl.searchParams.get('plan') === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 10 AI calls per tenant per hour
  const rateCheck = checkAgentRateLimit(profile.tenant_id, 'contact-ai-analysis')
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  // Check cache (only for regular analysis, not plan generation)
  if (!wantPlan) {
    const cached = cache.get(id)
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.data)
    }
  }

  // Fetch contact
  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Validate campaign ownership
  const campaignIds: string[] = profile.campaign_ids ?? []
  if (!campaignIds.includes(contact.campaign_id as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const campaignId = contact.campaign_id as string
  const adminSupabase = createAdminClient()

  // Fetch recent visits for context
  const { data: visits } = await supabase
    .from('canvass_visits')
    .select('result, notes, created_at, sympathy_level')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Sanitize user-controlled fields before inserting into prompts (prompt injection prevention)
  const safeFirstName = sanitizeForPrompt(contact.first_name, 100)
  const safeLastName  = sanitizeForPrompt(contact.last_name,  100)
  const safeStatus    = sanitizeForPrompt(contact.status, 50)
  const safeZone      = sanitizeForPrompt(contact.district ?? contact.city, 100)
  const safeTags      = sanitizeTagsForPrompt(contact.tags)
  const safeNotes     = sanitizeForPrompt(contact.notes, 300)

  const visitsText = (visits ?? [])
    .map(v => `- ${v.created_at.split('T')[0]}: resultado=${sanitizeForPrompt(v.result, 50)}, simpatía=${v.sympathy_level ?? 'N/A'}, notas="${sanitizeForPrompt(v.notes, 150)}"`)
    .join('\n') || 'Sin visitas previas.'

  if (wantPlan) {
    const aiResult = await callAI(adminSupabase, profile.tenant_id, campaignId, [
      {
        role: 'user',
        content: `Eres un estratega político. Genera un plan de alcance breve (3-4 oraciones) y accionable para este contacto de campaña.

Contacto: ${safeFirstName} ${safeLastName}
Estado: ${safeStatus}
Zona: ${safeZone || 'No especificada'}
Tags: ${safeTags}
Notas: ${safeNotes || 'ninguna'}
Historial de visitas:
${visitsText}

Responde solo con el plan en texto plano, sin formato markdown, en español.`,
      },
    ], { maxTokens: 300 })

    const plan = aiResult.content || ''
    return NextResponse.json({ plan })
  }

  // Regular analysis
  const aiResult = await callAI(adminSupabase, profile.tenant_id, campaignId, [
    {
      role: 'user',
      content: `Eres un analista político. Analiza este contacto de campaña y responde en JSON estricto con este formato exacto:
{"tags": ["tag1","tag2","tag3"], "insight": "texto insight"}

Genera 3-5 tags cortos que describan al contacto (ej: "Pro-infraestructura", "Votante frecuente", "Zona rural").
El insight debe ser 1-2 oraciones accionables para el equipo de campaña.

Contacto: ${safeFirstName} ${safeLastName}
Estado: ${safeStatus}
Zona: ${safeZone || 'No especificada'}
Tags actuales: ${safeTags}
Notas: ${safeNotes || 'ninguna'}
Historial de visitas:
${visitsText}

Responde SOLO con el JSON, sin markdown ni explicaciones adicionales.`,
    },
  ], { maxTokens: 400 })

  const raw = aiResult.content || '{}'
  let result: { tags: string[]; insight: string }
  try {
    result = JSON.parse(raw)
  } catch {
    result = { tags: [], insight: raw }
  }

  // Cache for 1 hour
  cache.set(id, { data: result, expiresAt: Date.now() + 60 * 60 * 1000 })

  return NextResponse.json(result)
}
