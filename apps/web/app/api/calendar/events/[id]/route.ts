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

  // Verify campaign ownership — IDOR fix
  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()
  const campaignIds: string[] = profile?.campaign_ids ?? []
  if (!campaignIds.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
    .in('campaign_id', campaignIds)  // IDOR fix
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update linked contacts if provided
  if ('linked_contact_ids' in body && data) {
    const linkedContactIds: string[] = body.linked_contact_ids ?? []
    const tenantId = (data as any).tenant_id

    // Remove existing contact participants for this event
    await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', id)
      .not('contact_id', 'is', null)

    // Insert new ones
    if (linkedContactIds.length > 0) {
      const participants = linkedContactIds.map((contactId: string) => ({
        tenant_id:  tenantId,
        event_id:   id,
        contact_id: contactId,
        role:       'attendee',
        status:     'confirmed',
      }))
      await supabase.from('event_participants').insert(participants)
    }
  }

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

  // Verify campaign ownership — IDOR fix
  const { data: deleteProfile } = await supabase
    .from('profiles')
    .select('campaign_ids')
    .eq('id', user.id)
    .single()
  const deleteCampaignIds: string[] = deleteProfile?.campaign_ids ?? []
  if (!deleteCampaignIds.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
    .in('campaign_id', deleteCampaignIds)  // IDOR fix

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
