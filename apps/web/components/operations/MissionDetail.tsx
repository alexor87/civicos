'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Circle, CheckCircle2, AlertTriangle, Calendar, Users, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { usePermissions } from '@/hooks/usePermission'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskDrawer } from './TaskDrawer'
import { toast } from 'sonner'

type Task = {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  assignee_id: string | null
  assignee?: { id: string; full_name: string } | null
  mission?: { id: string; name: string } | null
  mission_id: string | null
  description: string | null
  checklist: { text: string; done: boolean }[]
  tags: string[]
  created_by: string
  created_at: string
}

type Mission = {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  type: string
  due_date: string | null
  created_by: string
  owner_id: string | null
}

type MissionMember = { profile_id: string; full_name: string }
type Member = { id: string; full_name: string }

interface Props {
  campaignId: string
  userId: string
  mission: Mission
  tasks: Task[]
  missionMembers: MissionMember[]
  members: Member[]
  progress: { total_tasks: number; completed_tasks: number; progress_pct: number }
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-slate-50 text-slate-600 border-slate-200',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activa', completed: 'Completada', cancelled: 'Cancelada', on_hold: 'Pausada',
}

const MISSION_TYPE_LABELS: Record<string, string> = {
  canvassing: 'Canvassing', communications: 'Comunicaciones', event: 'Evento',
  administrative: 'Administrativa', ai_suggested: 'Sugerida por IA', flow_generated: 'Generada por Flow',
}

const TASK_STATUS_GROUPS = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'completed', label: 'Completadas' },
  { key: 'blocked', label: 'Bloqueadas' },
]

export function MissionDetail({ campaignId, userId, mission, tasks, missionMembers, members, progress }: Props) {
  const router = useRouter()
  const perms = usePermissions(['operations.create_tasks', 'operations.manage_all'])
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  async function toggleTaskStatus(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const res = await fetch(`/api/operations/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      toast.error('Error al actualizar tarea')
      return
    }
    router.refresh()
  }

  async function completeMission() {
    const res = await fetch(`/api/operations/missions/${mission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    if (!res.ok) {
      toast.error('Error al completar misión')
      return
    }
    toast.success('Misión completada')
    router.refresh()
  }

  async function deleteMission() {
    if (!confirm('¿Eliminar esta misión? Las tareas asociadas quedarán sin misión.')) return
    const res = await fetch(`/api/operations/missions/${mission.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Error al eliminar')
      return
    }
    toast.success('Misión eliminada')
    router.push('/dashboard/operations')
  }

  const canManage = mission.created_by === userId || mission.owner_id === userId || perms['operations.manage_all']
  const allComplete = progress.total_tasks > 0 && progress.completed_tasks === progress.total_tasks

  return (
    <div className="space-y-6">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/operations" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Volver a Operaciones
        </Link>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="ghost" size="sm" onClick={deleteMission} className="text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4 mr-1" /> Eliminar
            </Button>
          )}
          {allComplete && mission.status === 'active' && canManage && (
            <Button size="sm" onClick={completeMission}>Completar misión</Button>
          )}
          {perms['operations.create_tasks'] && (
            <Button size="sm" onClick={() => setTaskModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nueva tarea
            </Button>
          )}
        </div>
      </div>

      {/* Mission header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{mission.name}</h2>
          <Badge variant="outline" className={PRIORITY_COLORS[mission.priority]}>{mission.priority}</Badge>
          <Badge variant="outline">{STATUS_LABELS[mission.status] ?? mission.status}</Badge>
          <Badge variant="secondary" className="text-xs">{MISSION_TYPE_LABELS[mission.type] ?? mission.type}</Badge>
        </div>
        {mission.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400">{mission.description}</p>
        )}
      </div>

      {/* Progress + meta */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-sm text-slate-500 mb-2">Progreso</p>
            <div className="flex items-center gap-3">
              <Progress value={progress.progress_pct} className="flex-1 h-3" />
              <span className="text-sm font-semibold">{progress.progress_pct}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{progress.completed_tasks} de {progress.total_tasks} tareas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Fecha límite</p>
              <p className="text-sm font-medium">{mission.due_date ? new Date(mission.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-sm text-slate-500">Equipo</p>
              <p className="text-sm font-medium">{missionMembers.length > 0 ? missionMembers.map(m => m.full_name).join(', ') : 'Sin miembros'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks by status */}
      {TASK_STATUS_GROUPS.map(group => {
        const groupTasks = tasks.filter(t => t.status === group.key)
        if (groupTasks.length === 0) return null
        return (
          <div key={group.key}>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {group.label} <span className="text-slate-400 font-normal">({groupTasks.length})</span>
            </h3>
            <div className="space-y-1">
              {groupTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border border-transparent hover:border-slate-200"
                    onClick={() => setSelectedTask(task)}
                  >
                    <button onClick={e => { e.stopPropagation(); toggleTaskStatus(task) }} className="flex-shrink-0">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                    <span className={`flex-1 text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </span>
                    {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    {task.assignee && <span className="text-xs text-slate-500">{task.assignee.full_name}</span>}
                    <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                        {new Date(task.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">Sin tareas aún</p>
          <p className="text-sm mt-1">Crea la primera tarea para esta misión</p>
        </div>
      )}

      <CreateTaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} campaignId={campaignId} missions={[{ id: mission.id, name: mission.name }]} members={members} defaultMissionId={mission.id} />
      <TaskDrawer task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} members={members} userId={userId} />
    </div>
  )
}
