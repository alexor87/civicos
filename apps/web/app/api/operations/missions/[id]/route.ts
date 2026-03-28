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

  // Fetch mission with progress
  const { data: mission, error: missionError } = await admin
    .from('missions')
    .select('*, mission_progress(total_tasks, completed_tasks, progress_pct)')
    .eq('id', id)
    .single()

  if (missionError || !mission) {
    return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 })
  }

  // Fetch tasks ordered by sort_order, then created_at
  const { data: tasks } = await admin
    .from('tasks')
    .select('*')
    .eq('mission_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  // Fetch mission members
  const { data: members } = await admin
    .from('mission_members')
    .select('profile_id, added_at, added_by')
    .eq('mission_id', id)

  return NextResponse.json({
    ...mission,
    tasks: tasks ?? [],
    members: members ?? [],
  })
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

  // Check if user is creator/owner or has manage_all permission
  const { data: mission } = await admin
    .from('missions')
    .select('created_by, owner_id')
    .eq('id', id)
    .single()

  if (!mission) {
    return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 })
  }

  const isCreatorOrOwner = mission.created_by === user.id || mission.owner_id === user.id
  if (!isCreatorOrOwner) {
    const canManageAll = await checkPermission(admin, user.id, 'operations.manage_all')
    if (!canManageAll) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, status, priority, due_date } = body

  const updateData: Record<string, any> = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (status !== undefined) updateData.status = status
  if (priority !== undefined) updateData.priority = priority
  if (due_date !== undefined) updateData.due_date = due_date

  // If status changed to 'completed', set completed_at
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No se proporcionaron campos para actualizar' }, { status: 400 })
  }

  const { data: updated, error } = await admin
    .from('missions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(updated)
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

  // Check if user is creator or has manage_all permission
  const { data: mission } = await admin
    .from('missions')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!mission) {
    return NextResponse.json({ error: 'Misión no encontrada' }, { status: 404 })
  }

  const isCreator = mission.created_by === user.id
  if (!isCreator) {
    const canManageAll = await checkPermission(admin, user.id, 'operations.manage_all')
    if (!canManageAll) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  // Delete mission — tasks get mission_id SET NULL via FK ON DELETE SET NULL
  const { error } = await admin
    .from('missions')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
