import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const BUCKET = 'knowledge-docs'

function getAdminStorage() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  ).storage
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const canDelete = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get meta to find file path
  const { data: meta } = await supabase
    .from('knowledge_document_meta')
    .select('id, file_path')
    .eq('id', id)
    .single()

  if (!meta) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  // Delete chunks (cascades via FK, but explicit for clarity)
  await supabase
    .from('knowledge_documents')
    .delete()
    .eq('meta_id', id)

  // Delete from storage
  if (meta.file_path) {
    const adminStorage = getAdminStorage()
    await adminStorage.from(BUCKET).remove([meta.file_path])
  }

  // Delete meta row
  const { error } = await supabase
    .from('knowledge_document_meta')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
