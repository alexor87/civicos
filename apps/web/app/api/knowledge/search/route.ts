import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    query: string
    campaign_id: string
    limit?: number
    threshold?: number
  }

  const { query, campaign_id, limit = 5, threshold = 0.5 } = body

  if (!query?.trim() || !campaign_id) {
    return NextResponse.json({ error: 'query and campaign_id are required' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Generate embedding for the query
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  let queryEmbedding: number[]

  try {
    const embRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    })
    queryEmbedding = embRes.data[0].embedding
  } catch {
    return NextResponse.json({ error: 'Error generating embedding' }, { status: 500 })
  }

  // Semantic search via pgvector RPC
  const { data, error } = await supabase.rpc('match_knowledge_documents', {
    query_embedding: JSON.stringify(queryEmbedding),
    p_campaign_id:   campaign_id,
    p_tenant_id:     profile.tenant_id,
    match_threshold: threshold,
    match_count:     limit,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
