import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/calendar/events/[id]/complete
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('calendar_events')
    .update({
      status:             'completed',
      completed_at:        new Date().toISOString(),
      actual_attendance:   body.actual_attendance ?? null,
      post_event_notes:    body.post_event_notes ?? null,
      post_event_rating:   body.post_event_rating ?? null,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
