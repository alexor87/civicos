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
  const campaignId = searchParams.get('campaign_id')
  const status = searchParams.get('status')

  if (!campaignId) {
    return NextResponse.json({ error: 'campaign_id es requerido' }, { status: 400 })
  }

  let query = admin
    .from('missions')
    .select('*, mission_progress(total_tasks, completed_tasks, progress_pct)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data: missions, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(missions ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  let admin: ReturnType<typeof createAdminClient>
  try { admin = createAdminClient() } catch {
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }

  const can = await checkPermission(admin, user.id, 'operations.create_missions')
  if (!can) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const body = await request.json()
  const { campaign_id, name, description, type, priority, due_date, template_key } = body

  if (!campaign_id || !name) {
    return NextResponse.json({ error: 'campaign_id y name son requeridos' }, { status: 400 })
  }

  // Get user's tenant_id
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 })
  }

  // If template_key provided, look up the template
  let template: { type: string; description: string; tasks: any[] } | null = null
  if (template_key) {
    const { data: tpl } = await admin
      .from('mission_templates')
      .select('type, description, tasks')
      .eq('key', template_key)
      .single()

    if (tpl) {
      template = tpl as typeof template
    }
  }

  // Insert mission — template values as defaults, explicit body values take precedence
  const missionData = {
    tenant_id: profile.tenant_id,
    campaign_id,
    name,
    description: description ?? template?.description ?? null,
    type: type ?? template?.type ?? 'administrative',
    priority: priority ?? 'normal',
    due_date: due_date ?? null,
    template_key: template_key ?? null,
    created_by: user.id,
    owner_id: user.id,
  }

  const { data: mission, error: missionError } = await admin
    .from('missions')
    .insert(missionData)
    .select()
    .single()

  if (missionError) return NextResponse.json({ error: missionError.message }, { status: 500 })

  // If template was used, create tasks from template.tasks array
  if (template?.tasks && Array.isArray(template.tasks) && template.tasks.length > 0 && mission) {
    const taskRows = template.tasks.map((task: any, index: number) => {
      let taskDueDate: string | null = null
      if (due_date && typeof task.days_before_due === 'number') {
        const d = new Date(due_date)
        d.setDate(d.getDate() - task.days_before_due)
        taskDueDate = d.toISOString()
      }

      return {
        tenant_id: profile.tenant_id,
        campaign_id,
        mission_id: mission.id,
        title: task.title,
        sort_order: index,
        due_date: taskDueDate,
        created_by: user.id,
      }
    })

    const { error: tasksError } = await admin
      .from('tasks')
      .insert(taskRows)

    if (tasksError) {
      // Mission was created but tasks failed — log but don't fail the whole request
      console.error('Error creando tareas desde plantilla:', tasksError.message)
    }
  }

  return NextResponse.json(mission, { status: 201 })
}
