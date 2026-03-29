'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type Mission = { id: string; name: string }
type Member = { id: string; full_name: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  missions: Mission[]
  members: Member[]
  defaultMissionId?: string | null
}

const PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

const selectClass = 'w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring'
const inputClass = 'w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring'
const textareaClass = 'w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring resize-y'

function TaskForm({ campaignId, missions, members, defaultMissionId, onSuccess, onCancel }: {
  campaignId: string
  missions: Mission[]
  members: Member[]
  defaultMissionId?: string | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [missionId, setMissionId] = useState(defaultMissionId ?? '')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('El título es obligatorio')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/operations/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          title: title.trim(),
          description: description.trim() || null,
          mission_id: missionId || null,
          assignee_id: assigneeId || null,
          priority,
          due_date: dueDate || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al crear tarea')
        return
      }
      toast.success('Tarea creada')
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-5 py-1">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Título *</Label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Preparar lista de voluntarios"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Descripción</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalla qué se debe hacer..."
            className={textareaClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Misión</Label>
            <select value={missionId} onChange={e => setMissionId(e.target.value)} className={selectClass}>
              <option value="">Sin misión</option>
              {missions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Responsable</Label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={selectClass}>
              <option value="">Sin asignar</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Prioridad</Label>
            <select value={priority} onChange={e => setPriority(e.target.value)} className={selectClass}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Fecha límite</Label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creando...' : 'Crear tarea'}
        </Button>
      </DialogFooter>
    </>
  )
}

export function CreateTaskModal({ open, onOpenChange, campaignId, missions, members, defaultMissionId }: Props) {
  const router = useRouter()

  function handleSuccess() {
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>Crea una tarea y asígnala a un miembro del equipo</DialogDescription>
        </DialogHeader>
        {open && (
          <TaskForm
            campaignId={campaignId}
            missions={missions}
            members={members}
            defaultMissionId={defaultMissionId}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
