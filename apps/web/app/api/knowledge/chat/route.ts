import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAI } from '@/lib/ai/call-ai'
import OpenAI from 'openai'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SIMILARITY_THRESHOLD = 0.5
const FALLBACK_MESSAGE      = 'No tengo información sobre ese tema en los documentos de la campaña.'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { messages: ChatMessage[]; campaign_id: string }
  const { messages, campaign_id } = body

  if (!messages?.length || !campaign_id) {
    return NextResponse.json({ error: 'messages and campaign_id are required' }, { status: 400 })
  }

  // Get last user message for semantic search
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUserMsg) return NextResponse.json({ error: 'No user message found' }, { status: 400 })

  // Generate query embedding
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  let queryEmbedding: number[] = []

  try {
    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: lastUserMsg.content,
    })
    queryEmbedding = embRes.data[0].embedding
  } catch { /* will use empty context */ }

  // Search for relevant chunks
  let contextChunks: { title: string; content: string; similarity: number }[] = []

  if (queryEmbedding.length > 0) {
    const { data } = await supabase.rpc('match_knowledge_documents', {
      query_embedding: JSON.stringify(queryEmbedding),
      p_campaign_id:   campaign_id,
      p_tenant_id:     profile.tenant_id,
      match_threshold: SIMILARITY_THRESHOLD,
      match_count:     3,
    })
    contextChunks = (data ?? []) as typeof contextChunks
  }

  // If no relevant chunks, return fallback
  if (contextChunks.length === 0) {
    return new Response(FALLBACK_MESSAGE, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }

  // Build RAG system prompt
  const contextText = contextChunks
    .map(c => `### ${c.title}\n${c.content}`)
    .join('\n\n---\n\n')

  const systemPrompt = `Eres el asistente de la campaña. Responde ÚNICAMENTE con base en los siguientes documentos de la campaña. Si la respuesta no está en los documentos, dí: "${FALLBACK_MESSAGE}". Responde siempre en español.

DOCUMENTOS DE LA CAMPAÑA:
${contextText}`

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
