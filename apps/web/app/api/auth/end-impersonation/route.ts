import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { admin_email, tenant_id, tenant_name, session_id, started_at, ended_by } = body

    if (!admin_email || !tenant_id) {
      return NextResponse.json({ ok: true }) // Best effort
    }

    const supabase = await createAdminClient()

    const durationMinutes = Math.round(
      (Date.now() - new Date(started_at).getTime()) / 60000
    )

    const ipAddress =
      req.headers.get('x-forwarded-for') ??
      req.headers.get('x-real-ip') ??
      'unknown'

    await supabase.from('admin_audit_log').insert({
      action: 'impersonate_end',
      admin_email,
      tenant_id,
      tenant_name,
      payload: {
        session_id,
        duration_minutes: durationMinutes,
        ended_by: ended_by ?? 'manual',
      },
      ip_address: ipAddress,
    })
  } catch {
    // Best effort — don't fail the request
  }

  // Delete the impersonation cookie
  const cookieStore = await cookies()
  cookieStore.delete('civicos_impersonation')

  return NextResponse.json({ ok: true })
}
