import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: visits } = await supabase
    .from('canvass_visits')
    .select('id, result, notes, created_at')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })
    .limit(3)

  return NextResponse.json({ visits: visits ?? [] })
}
