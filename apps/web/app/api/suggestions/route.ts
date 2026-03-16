import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, action, feedback } = await request.json()

  const updateData: Record<string, unknown> = {}

  if (action === 'approved') {
    updateData.status = 'applied'
    updateData.applied_at = new Date().toISOString()
  } else if (action === 'dismissed') {
    updateData.status = 'dismissed'
    updateData.dismissed_at = new Date().toISOString()
  } else if (action === 'rejected') {
    updateData.status = 'rejected'
    updateData.dismissed_at = new Date().toISOString()
  }

  if (feedback) updateData.feedback = feedback

  const { data: updated, error } = await supabase
    .from('ai_suggestions')
    .update(updateData)
    .eq('id', id)
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // RLS returns 0 rows when suggestion doesn't belong to this tenant
  if (!updated?.length) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({ success: true })
}
