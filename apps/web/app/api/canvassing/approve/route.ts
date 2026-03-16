import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ROLES = ['super_admin', 'campaign_manager', 'field_coordinator']

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const profile = profileData as { role: string } | null
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const formData = await request.formData()
  const visitId = formData.get('visitId') as string
  const action = (formData.get('action') as string) || 'approve'
  const rejectionReason = (formData.get('rejection_reason') as string) || null

  if (!visitId) return NextResponse.json({ error: 'Missing visitId' }, { status: 400 })

  const now = new Date().toISOString()

  if (action === 'reject') {
    const { error } = await supabase
      .from('canvass_visits')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: now,
        rejection_reason: rejectionReason,
      } as any)
      .eq('id', visitId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // Approve: update status, legacy approved_at, and trigger CRM update
    const { data: visit, error } = await supabase
      .from('canvass_visits')
      .update({
        status: 'approved',
        approved_at: now,
        approved_by: user.id,
        reviewed_by: user.id,
        reviewed_at: now,
      } as any)
      .eq('id', visitId)
      .select('contact_id, sympathy_level, wants_to_volunteer, result')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update CRM: sync sympathy_level to contact metadata
    if (visit && visit.sympathy_level != null) {
      const sympathyToStatus: Record<number, string> = {
        5: 'supporter', 4: 'supporter', 3: 'undecided', 2: 'opponent', 1: 'opponent',
      }
      const newStatus = sympathyToStatus[visit.sympathy_level as number]

      const { data: contact } = await supabase
        .from('contacts')
        .select('metadata')
        .eq('id', visit.contact_id)
        .single()

      const meta = (contact?.metadata as Record<string, unknown>) ?? {}
      await supabase
        .from('contacts')
        .update({
          metadata: { ...meta, sympathy_level: visit.sympathy_level },
          ...(newStatus ? { status: newStatus } : {}),
        } as any)
        .eq('id', visit.contact_id)
    }
  }

  return NextResponse.redirect(new URL('/dashboard/canvassing', request.url))
}
