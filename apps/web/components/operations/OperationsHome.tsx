'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Target, CheckCircle2, Clock, AlertTriangle, ChevronRight, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { usePermissions } from '@/hooks/usePermission'
import { CreateMissionModal } from './CreateMissionModal'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskDrawer } from './TaskDrawer'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Mission = {
  id: string
  name: string
  status: string
  priority: string
  due_date: string | null
  total_tasks: number
  completed_tasks: number
  progress_pct: number
}

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

type Template = { key: string; name: string; description: string | null; type: string }
type Member = { id: string; full_name: string }

interface Props {
  campaignId: string
  userId: string
  kpis: { activeMissions: number; totalTasks: number; completedToday: number; overdueTasks: number }
  missions: Mission[]
  myTasks: Task[]
  allMissions: { id: string; name: string }[]
  members: Member[]
  templates: Template[]
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-slate-50 text-slate-600 border-slate-200',
}

export function OperationsHome({ campaignId, userId, kpis, missions, myTasks, allMissions, members, templates }: Props) {
  const router = useRouter()
  const perms = usePermissions(['operations.create_tasks', 'operations.create_missions'])
  const [missionModalOpen, setMissionModalOpen] = useState(false)
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

  const kpiCards = [
    { label: 'Misiones activas', value: kpis.activeMissions, icon: Target, color: 'text-blue-600' },
    { label: 'Total tareas', value: kpis.totalTasks, icon: CheckCircle2, color: 'text-slate-600' },
    { label: 'Completadas hoy', value: kpis.completedToday, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Vencidas', value: kpis.overdueTasks, icon: AlertTriangle, color: kpis.overdueTasks > 0 ? 'text-red-600' : 'text-slate-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-2 justify-end">
        {perms['operations.create_missions'] && (
          <Button variant="outline" onClick={() => setMissionModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva misión
          </Button>
        )}
        {perms['operations.create_tasks'] && (
          <Button onClick={() => setTaskModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva tarea
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active missions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Misiones activas</CardTitle>
            <Link href="/dashboard/operations/board" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todo <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {missions.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Sin misiones activas</p>
            ) : (
              missions.map(m => (
                <Link key={m.id} href={`/dashboard/operations/missions/${m.id}`} className="block p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{m.name}</span>
                    <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[m.priority]}`}>
                      {m.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={m.progress_pct} className="flex-1 h-2" />
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {m.completed_tasks}/{m.total_tasks}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* My tasks today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Mis tareas para hoy</CardTitle>
            <Link href="/dashboard/operations/list" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todo <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1">
            {myTasks.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Sin tareas pendientes para hoy</p>
            ) : (
              myTasks.map(task => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
                return (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 group">
                    <button onClick={() => toggleTaskStatus(task)} className="flex-shrink-0">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedTask(task)}
                      className={`flex-1 text-left text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {task.title}
                    </button>
                    {isOverdue && <Badge variant="destructive" className="text-xs">Vencida</Badge>}
                    <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <CreateMissionModal open={missionModalOpen} onOpenChange={setMissionModalOpen} campaignId={campaignId} templates={templates} />
      <CreateTaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} campaignId={campaignId} missions={allMissions} members={members} />
      <TaskDrawer task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} members={members} userId={userId} />
    </div>
  )
}
