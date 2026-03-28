import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkPermission } from '@/lib/auth/check-permission'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch {
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  const can = await checkPermission(admin, user.id, 'operations.view')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { data, error } = await admin
    .from('tasks')
    .select('*, assignee:profiles!tasks_assignee_id_fkey(id, full_name), mission:missions!tasks_mission_id_fkey(id, name)')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch {
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  // Check if user is assignee/creator OR has manage_all permission
  const { data: task } = await admin
    .from('tasks')
    .select('assignee_id, created_by, status')
    .eq('id', id)
    .single()

  if (!task) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  const isOwner = task.assignee_id === user.id || task.created_by === user.id
  if (!isOwner) {
    const canManage = await checkPermission(admin, user.id, 'operations.manage_all')
    if (!canManage) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const allowedFields = [
    'title', 'description', 'status', 'priority', 'due_date',
    'assignee_id', 'checklist', 'tags', 'sort_order', 'mission_id',
  ]

  const updateData: Record<string, any> = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  // Handle completed_at based on status changes
  if (body.status !== undefined) {
    if (body.status === 'completed' && task.status !== 'completed') {
      updateData.completed_at = new Date().toISOString()
    } else if (body.status !== 'completed' && task.status === 'completed') {
      updateData.completed_at = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No se proporcionaron campos para actualizar' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch {
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  // Check if user is creator OR has manage_all permission
  const { data: task } = await admin
    .from('tasks')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!task) return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })

  const isCreator = task.created_by === user.id
  if (!isCreator) {
    const canManage = await checkPermission(admin, user.id, 'operations.manage_all')
    if (!canManage) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { error } = await admin
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
