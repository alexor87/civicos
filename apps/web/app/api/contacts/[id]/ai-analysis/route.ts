import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

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
    .single()

  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch recent visits for context
  const { data: visits } = await supabase
    .from('canvass_visits')
    .select('result, notes, created_at, sympathy_level')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const client = new Anthropic()

  const visitsText = (visits ?? [])
    .map(v => `- ${v.created_at.split('T')[0]}: resultado=${v.result}, simpatía=${v.sympathy_level ?? 'N/A'}, notas="${v.notes ?? ''}"`)
    .join('\n') || 'Sin visitas previas.'

  if (wantPlan) {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Eres un estratega político. Genera un plan de alcance breve (3-4 oraciones) y accionable para este contacto de campaña.

Contacto: ${contact.first_name} ${contact.last_name}
Estado: ${contact.status}
Zona: ${contact.district ?? contact.city ?? 'No especificada'}
Tags: ${contact.tags.join(', ') || 'ninguno'}
Notas: ${contact.notes ?? 'ninguna'}
Historial de visitas:
${visitsText}

Responde solo con el plan en texto plano, sin formato markdown, en español.`,
        },
      ],
    })

    const plan = message.content[0]?.type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ plan })
  }

  // Regular analysis
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content: `Eres un analista político. Analiza este contacto de campaña y responde en JSON estricto con este formato exacto:
{"tags": ["tag1","tag2","tag3"], "insight": "texto insight"}

Genera 3-5 tags cortos que describan al contacto (ej: "Pro-infraestructura", "Votante frecuente", "Zona rural").
El insight debe ser 1-2 oraciones accionables para el equipo de campaña.

Contacto: ${contact.first_name} ${contact.last_name}
Estado: ${contact.status}
Zona: ${contact.district ?? contact.city ?? 'No especificada'}
Tags actuales: ${contact.tags.join(', ') || 'ninguno'}
Notas: ${contact.notes ?? 'ninguna'}
Historial de visitas:
${visitsText}

Responde SOLO con el JSON, sin markdown ni explicaciones adicionales.`,
      },
    ],
  })

  const raw = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
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
