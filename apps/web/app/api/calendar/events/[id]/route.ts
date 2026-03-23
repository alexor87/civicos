import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/calendar/events/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  // Only allow updating safe fields
  const allowed = [
    'title', 'event_type', 'all_day', 'start_at', 'end_at',
    'location_text', 'municipality_name', 'municipality_code', 'neighborhood_name',
    'description', 'internal_notes', 'expected_attendance',
  ]
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/calendar/events/[id] — soft delete
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const reason = searchParams.get('reason') ?? null

  const { error } = await supabase
    .from('calendar_events')
    .update({
      status:              'cancelled',
      cancelled_at:        new Date().toISOString(),
      cancellation_reason: reason,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
