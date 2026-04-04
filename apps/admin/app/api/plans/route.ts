import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyAdminUser } from '@/lib/admin-auth'
import { insertAuditLog } from '@/lib/audit'

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const admin = await verifyAdminUser(user.id)
  if (!admin) return NextResponse.json({ error: 'Not an admin' }, { status: 403 })

  const { updates } = await request.json()
  if (!Array.isArray(updates)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

  const adminSupabase = createAdminClient()

  for (const { plan, feature_key, value } of updates) {
    await adminSupabase
      .from('plan_features')
      .upsert(
        { plan, feature_key, value, updated_at: new Date().toISOString() },
        { onConflict: 'plan,feature_key' }
      )
  }

  await insertAuditLog({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'plan_features_updated',
    payload: { changes_count: updates.length, updates },
  })

  return NextResponse.json({ ok: true, updated: updates.length })
}
