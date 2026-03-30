'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Calendar, User, Flag, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  assignee_id: string | null
  assignee?: { id: string; full_name: string } | null
  checklist: { text: string; done: boolean }[]
  tags: string[]
  created_by: string
  created_at: string
}

type Member = { id: string; full_name: string }

interface Props {
  task: Task | null
  open: boolean
  onClose: () => void
  members: Member[]
  userId: string
}

const STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed', label: 'Completada' },
  { value: 'blocked', label: 'Bloqueada' },
]

const PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

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

export function TaskDrawer({ task, open, onClose, members, userId }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [checklist, setChecklist] = useState<{ text: string; done: boolean }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setStatus(task.status)
      setPriority(task.priority)
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '')
      setAssigneeId(task.assignee_id ?? '')
      setChecklist(task.checklist ?? [])
      setEditing(false)
    }
  }, [task])

  if (!open || !task) return null

  async function save(patch: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/operations/tasks/${task!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al actualizar')
        return false
      }
      router.refresh()
      return true
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus)
    const ok = await save({ status: newStatus })
    if (ok) toast.success('Estado actualizado')
  }

  async function handleSaveAll() {
    const ok = await save({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      due_date: dueDate || null,
      assignee_id: assigneeId || null,
      checklist,
    })
    if (ok) {
      toast.success('Tarea actualizada')
      setEditing(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta tarea?')) return
    const res = await fetch(`/api/operations/tasks/${task!.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Error al eliminar')
      return
    }
    toast.success('Tarea eliminada')
    onClose()
    router.refresh()
  }

  function toggleChecklistItem(idx: number) {
    const updated = checklist.map((item, i) => i === idx ? { ...item, done: !item.done } : item)
    setChecklist(updated)
    save({ checklist: updated })
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${STATUS_COLORS[task.status]}`}>
            {STATUSES.find(s => s.value === task.status)?.label ?? task.status}
          </Badge>
          {isOverdue && <Badge variant="destructive" className="text-xs">Vencida</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-slate-400 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Title */}
        {editing ? (
          <Input value={title} onChange={e => setTitle(e.target.value)} className="text-lg font-semibold" />
        ) : (
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white cursor-pointer" onClick={() => setEditing(true)}>
            {task.title}
          </h2>
        )}

        {/* Quick status change */}
        <div className="flex gap-2">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={saving}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === s.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Meta fields */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Flag className="h-4 w-4 text-slate-400" />
            {editing ? (
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                {PRIORITIES.find(p => p.value === task.priority)?.label}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-slate-400" />
            {editing ? (
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Sin asignar</SelectItem>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-slate-600 dark:text-slate-400">
                {task.assignee?.full_name ?? 'Sin asignar'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            {editing ? (
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-8" />
            ) : (
              <span className={`${isOverdue ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                {task.due_date ? new Date(task.due_date).toLocaleDateString('es-CO') : 'Sin fecha'}
              </span>
            )}
          </div>

        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-400 uppercase tracking-wider">Descripción</Label>
          {editing ? (
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer" onClick={() => setEditing(true)}>
              {task.description || 'Sin descripción — clic para agregar'}
            </p>
          )}
        </div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-400 uppercase tracking-wider">
              Checklist ({checklist.filter(c => c.done).length}/{checklist.length})
            </Label>
            <div className="space-y-1">
              {checklist.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleChecklistItem(idx)}
                  className="flex items-center gap-2 w-full text-left text-sm py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded px-1"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-300 flex-shrink-0" />
                  )}
                  <span className={item.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {editing && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
          <Button size="sm" onClick={handleSaveAll} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      )}
    </div>
  )
}
