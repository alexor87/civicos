'use client'

import { useState } from 'react'
import { Plus, Circle, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
  description: string | null
  checklist: { text: string; done: boolean }[]
  tags: string[]
  created_by: string
  created_at: string
}

type Member = { id: string; full_name: string }

interface Props {
  campaignId: string
  userId: string
  tasks: Task[]
  members: Member[]
}

const COLUMNS = [
  { key: 'pending', label: 'Pendiente', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-50' },
  { key: 'in_progress', label: 'En progreso', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'completed', label: 'Completado', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  normal: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-slate-50 text-slate-600 border-slate-200',
}

export function KanbanBoard({ campaignId, userId, tasks, members }: Props) {
  const router = useRouter()
  const perms = usePermissions(['operations.create_tasks'])
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const filtered = tasks.filter(t => {
    if (filterAssignee && t.assignee_id !== filterAssignee) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  async function moveTask(taskId: string, newStatus: string) {
    const res = await fetch(`/api/operations/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) {
      toast.error('Error al mover tarea')
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="Todos los miembros" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todos los miembros</SelectItem>
            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Prioridad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value=" ">Todas</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {perms['operations.create_tasks'] && (
          <Button size="sm" onClick={() => setTaskModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva tarea
          </Button>
        )}
      </div>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-4 min-h-[60vh]">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.key)
          return (
            <div key={col.key} className={`${col.bg} dark:bg-slate-800/50 rounded-xl p-3`}>
              <div className="flex items-center gap-2 mb-3 px-1">
                <col.icon className={`h-4 w-4 ${col.color}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{col.label}</span>
                <span className="text-xs text-slate-400 ml-auto">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map(task => {
                  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white dark:bg-slate-900 rounded-lg p-3 shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">{task.title}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </Badge>
                        {task.assignee && (
                          <span className="text-xs text-slate-500">{task.assignee.full_name}</span>
                        )}
                        {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500 ml-auto" />}
                        {task.due_date && (
                          <span className={`text-xs ml-auto ${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                            {new Date(task.due_date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      {/* Quick status buttons */}
                      {col.key !== 'completed' && (
                        <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {COLUMNS.filter(c => c.key !== col.key).map(c => (
                            <button
                              key={c.key}
                              onClick={e => { e.stopPropagation(); moveTask(task.id, c.key) }}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <CreateTaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} campaignId={campaignId} members={members} />
      <TaskDrawer task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} members={members} userId={userId} />
    </div>
  )
}
