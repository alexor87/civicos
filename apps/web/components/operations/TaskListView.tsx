'use client'

import { useState, useMemo } from 'react'
import { Plus, Circle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { usePermissions } from '@/hooks/usePermission'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskDrawer } from './TaskDrawer'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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

type Mission = { id: string; name: string }
type Member = { id: string; full_name: string }

interface Props {
  campaignId: string
  userId: string
  tasks: Task[]
  missions: Mission[]
  members: Member[]
}

type GroupBy = 'none' | 'mission' | 'assignee' | 'priority'

const PRIORITY_LABELS: Record<string, string> = { urgent: 'Urgente', high: 'Alta', normal: 'Normal', low: 'Baja' }
const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', in_progress: 'En progreso', completed: 'Completada', blocked: 'Bloqueada', cancelled: 'Cancelada' }

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-slate-50 text-slate-600 border-slate-200',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-50 text-slate-400 border-slate-200',
}

export function TaskListView({ campaignId, userId, tasks, missions, members }: Props) {
  const router = useRouter()
  const perms = usePermissions(['operations.create_tasks'])
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = filterStatus ? tasks.filter(t => t.status === filterStatus) : tasks

  const grouped = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', label: null, tasks: filtered }]

    const groups: Record<string, Task[]> = {}
    for (const t of filtered) {
      let key: string
      if (groupBy === 'mission') key = t.mission?.name ?? 'Sin misión'
      else if (groupBy === 'assignee') key = t.assignee?.full_name ?? 'Sin asignar'
      else key = PRIORITY_LABELS[t.priority] ?? t.priority
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    return Object.entries(groups).map(([key, tasks]) => ({ key, label: key, tasks }))
  }, [filtered, groupBy])

  async function toggleStatus(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const res = await fetch(`/api/operations/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      toast.error('Error al actualizar')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={groupBy} onValueChange={v => setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Agrupar por..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin agrupar</SelectItem>
            <SelectItem value="mission">Por misión</SelectItem>
            <SelectItem value="assignee">Por responsable</SelectItem>
            <SelectItem value="priority">Por prioridad</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="completed">Completada</SelectItem>
            <SelectItem value="blocked">Bloqueada</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {perms['operations.create_tasks'] && (
          <Button size="sm" onClick={() => setTaskModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva tarea
          </Button>
        )}
      </div>

      {/* Table */}
      {grouped.map(group => (
        <div key={group.key}>
          {group.label && (
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 mt-4">
              {group.label} <span className="text-slate-400 font-normal">({group.tasks.length})</span>
            </h3>
          )}
          <div className="border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Tarea</TableHead>
                  <TableHead className="w-28">Estado</TableHead>
                  <TableHead className="w-24">Prioridad</TableHead>
                  <TableHead className="w-36">Responsable</TableHead>
                  <TableHead className="w-32">Misión</TableHead>
                  <TableHead className="w-28">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-400 py-8">Sin tareas</TableCell>
                  </TableRow>
                ) : (
                  group.tasks.map(task => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'
                    return (
                      <TableRow key={task.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setSelectedTask(task)}>
                        <TableCell>
                          <button onClick={e => { e.stopPropagation(); toggleStatus(task) }}>
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </span>
                          {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500 inline ml-2" />}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[task.status]}`}>
                            {STATUS_LABELS[task.status] ?? task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                            {PRIORITY_LABELS[task.priority] ?? task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{task.assignee?.full_name ?? '—'}</TableCell>
                        <TableCell className="text-sm text-slate-500 truncate max-w-[8rem]">{task.mission?.name ?? '—'}</TableCell>
                        <TableCell className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          {task.due_date ? new Date(task.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}

      <CreateTaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} campaignId={campaignId} missions={missions} members={members} />
      <TaskDrawer task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} members={members} userId={userId} />
    </div>
  )
}
