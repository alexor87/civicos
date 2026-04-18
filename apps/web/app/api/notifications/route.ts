import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const limit = Number(req.nextUrl.searchParams.get('limit') ?? '20')

  const [{ data: notifications, error }, { count }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    notifications: notifications ?? [],
    unread_count: count ?? 0,
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)

  if (body.all) {
    query = query.eq('read', false)
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    query = query.in('id', body.ids)
  } else {
    return NextResponse.json({ error: 'Envía { all: true } o { ids: [...] }' }, { status: 400 })
  }

  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
