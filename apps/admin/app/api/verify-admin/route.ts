import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminUser, updateAdminLastLogin } from '@/lib/admin-auth'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const admin = await verifyAdminUser(user.id)
  if (!admin) {
    return NextResponse.json({ error: 'Not an admin' }, { status: 403 })
  }

  // Update last login timestamp
  await updateAdminLastLogin(admin.id)

  return NextResponse.json({ ok: true, admin: { id: admin.id, email: admin.email, full_name: admin.full_name } })
}
