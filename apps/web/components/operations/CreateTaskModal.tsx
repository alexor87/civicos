'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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

export function CreateTaskModal({ open, onOpenChange, campaignId, missions, members, defaultMissionId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [missionId, setMissionId] = useState(defaultMissionId ?? '')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')

  function reset() {
    setTitle('')
    setDescription('')
    setMissionId(defaultMissionId ?? '')
    setAssigneeId('')
    setPriority('normal')
    setDueDate('')
  }

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
      reset()
      onOpenChange(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl overflow-visible">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>Crea una tarea y asígnala a un miembro del equipo</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Preparar lista de voluntarios" />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Detalla qué se debe hacer..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Misión</Label>
              <Select value={missionId} onValueChange={setMissionId}>
                <SelectTrigger><SelectValue placeholder="Sin misión" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Sin misión</SelectItem>
                  {missions.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Responsable</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Sin asignar</SelectItem>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha límite</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear tarea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
