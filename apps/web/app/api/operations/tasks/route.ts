import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch {
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  const can = await checkPermission(admin, user.id, 'operations.view')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const campaign_id = searchParams.get('campaign_id')
  const status = searchParams.get('status')
  const assignee_id = searchParams.get('assignee_id')
  const due_date = searchParams.get('due_date')

  if (!campaign_id) {
    return NextResponse.json({ error: 'campaign_id es requerido' }, { status: 400 })
  }

  let query = admin
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(id, full_name)')
    .eq('campaign_id', campaign_id)

  if (status) query = query.eq('status', status)
  if (assignee_id) query = query.eq('assignee_id', assignee_id)
  if (due_date) query = query.lte('due_date', due_date)

  query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch {
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  const can = await checkPermission(admin, user.id, 'operations.create_tasks')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { campaign_id, title, assignee_id, due_date, priority, description, tags } = body

  if (!campaign_id || !title) {
    return NextResponse.json({ error: 'campaign_id y title son requeridos' }, { status: 400 })
  }

  // Get tenant_id from user profile
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

  const insertData: Record<string, any> = {
    tenant_id: profile.tenant_id,
    campaign_id,
    title,
    created_by: user.id,
  }

  if (assignee_id) insertData.assignee_id = assignee_id
  if (due_date) insertData.due_date = due_date
  if (priority) insertData.priority = priority
  if (description !== undefined) insertData.description = description
  if (tags) insertData.tags = tags

  const { data, error } = await admin
    .from('tasks')
    .insert(insertData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
