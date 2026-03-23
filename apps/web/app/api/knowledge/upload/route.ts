import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const BUCKET      = 'knowledge-docs'
const CHUNK_SIZE  = 3200 // ~800 tokens (4 chars/token estimate)

function getAdminStorage() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  ).storage
}

function chunkText(text: string, chunkSize = CHUNK_SIZE): string[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    if (current.length + para.length > chunkSize && current.length > 0) {
      chunks.push(current.trim())
      current = para
    } else {
      current += (current ? '\n\n' : '') + para
    }
  }

  if (current.trim()) chunks.push(current.trim())

  // If no paragraphs, split by fixed size
  if (chunks.length === 0 && text.trim()) {
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize).trim())
    }
  }

  return chunks.filter(c => c.length > 0)
}

async function extractText(file: File): Promise<string> {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? ''
  const mime = file.type?.toLowerCase() ?? ''

  const isText = ext === 'txt' || ext === 'md'
    || mime === 'text/plain' || mime === 'text/markdown'
  const isPdf  = ext === 'pdf' || mime === 'application/pdf'
  const isDocx = ext === 'docx'
    || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  if (isText) {
    return file.text()
  }

  const buf = Buffer.from(await file.arrayBuffer())

  if (isPdf) {
    const pdfParse = (await import('pdf-parse') as any).default ?? (await import('pdf-parse'))
    const result   = await pdfParse(buf)
    return result.text
  }

  if (isDocx) {
    const mammoth = await import('mammoth')
    const result  = await mammoth.extractRawText({ buffer: buf })
    return result.value
  }

  throw new Error(`Tipo de archivo no soportado: .${ext || mime}`)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canUpload = ['super_admin', 'campaign_manager', 'analyst'].includes(profile?.role ?? '')
  if (!canUpload) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let formData: FormData
  try { formData = await req.formData() }
  catch { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }) }

  const file        = formData.get('file') as File | null
  const campaign_id = formData.get('campaign_id') as string | null
  const titleInput  = formData.get('title') as string | null

  if (!file)        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

  const title    = titleInput?.trim() || file.name.replace(/\.[^/.]+$/, '')
  const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'txt'
  const filePath = `${profile!.tenant_id}/${campaign_id}/${Date.now()}-${file.name}`

  // 1. Extract text
  let fullText: string
  try {
    fullText = await extractText(file)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 })
  }

  // 2. Upload raw file to Storage
  const adminStorage = getAdminStorage()
  await adminStorage.createBucket(BUCKET, {
    public:           false,
    fileSizeLimit:    10485760,
    allowedMimeTypes: ['application/pdf', 'text/plain', 'text/markdown',
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  })

  const fileBuffer = Buffer.from(await file.arrayBuffer())
  await adminStorage.from(BUCKET).upload(filePath, fileBuffer, {
    contentType: file.type || 'text/plain',
    upsert:      false,
  })

  // 3. Insert metadata row
  const { data: meta, error: metaErr } = await supabase
    .from('knowledge_document_meta')
    .insert({
      tenant_id:   profile!.tenant_id,
      campaign_id,
      title,
      file_path:   filePath,
      file_type:   ext as 'pdf' | 'txt' | 'docx' | 'md',
      total_chunks: 0,
      total_tokens: 0,
      created_by:  user.id,
    })
    .select('id')
    .single()

  if (metaErr || !meta) {
    return NextResponse.json({ error: 'Error creating document metadata' }, { status: 500 })
  }

  // 4. Chunk + embed
  const chunks  = chunkText(fullText)
  const openai  = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  let inserted  = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    let embedding: number[] = []

    try {
      const embRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
      })
      embedding = embRes.data[0].embedding
    } catch { /* store chunk without embedding on error */ }

    const { error: chunkErr } = await supabase
      .from('knowledge_documents')
      .insert({
        tenant_id:   profile!.tenant_id,
        campaign_id,
        meta_id:     meta.id,
        title,
        content:     chunk,
        file_path:   filePath,
        file_type:   ext as 'pdf' | 'txt' | 'docx' | 'md',
        chunk_index: i,
        embedding:   embedding.length > 0 ? JSON.stringify(embedding) : null,
        token_count: Math.ceil(chunk.length / 4),
        created_by:  user.id,
      })

    if (!chunkErr) inserted++
  }

  // 5. Update meta with chunk count
  await supabase
    .from('knowledge_document_meta')
    .update({
      total_chunks: inserted,
      total_tokens: Math.ceil(fullText.length / 4),
    })
    .eq('id', meta.id)

  return NextResponse.json({ id: meta.id, title, chunks: inserted })
}
