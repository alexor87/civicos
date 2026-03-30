'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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

const taskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  mission_id: z.string().optional(),
  assignee_id: z.string().optional(),
  priority: z.string().default('normal'),
  due_date: z.string().optional(),
})

type TaskFormValues = z.infer<typeof taskSchema>

const PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

function TaskForm({ campaignId, missions, members, defaultMissionId, onSuccess, onCancel }: {
  campaignId: string
  missions: Mission[]
  members: Member[]
  defaultMissionId?: string | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      mission_id: defaultMissionId ?? '',
      assignee_id: '',
      priority: 'normal',
      due_date: '',
    },
  })

  const missionId = watch('mission_id')
  const assigneeId = watch('assignee_id')
  const priority = watch('priority')

  async function onSubmit(data: TaskFormValues) {
    setLoading(true)
    try {
      const res = await fetch('/api/operations/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          mission_id: data.mission_id || null,
          assignee_id: data.assignee_id || null,
          priority: data.priority,
          due_date: data.due_date || null,
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
    <form onSubmit={handleSubmit(onSubmit)} className="contents">
      <div className="space-y-5 py-1">
        <div className="space-y-1.5">
          <Label htmlFor="task-title">Título <span className="text-red-500">*</span></Label>
          <Input id="task-title" placeholder="Ej: Preparar lista de voluntarios" {...register('title')} />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-desc">Descripción</Label>
          <Textarea id="task-desc" rows={3} placeholder="Detalla qué se debe hacer..." {...register('description')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Misión</Label>
            <Select value={missionId || undefined} onValueChange={v => setValue('mission_id', v === ' ' ? '' : v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sin misión" /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Sin misión</SelectItem>
                {missions.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Responsable</Label>
            <Select value={assigneeId || undefined} onValueChange={v => setValue('assignee_id', v === ' ' ? '' : v)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Sin asignar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Sin asignar</SelectItem>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Prioridad</Label>
            <Select value={priority} onValueChange={v => setValue('priority', v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-due">Fecha límite</Label>
            <Input id="task-due" type="date" {...register('due_date')} />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear tarea'}
        </Button>
      </DialogFooter>
    </form>
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
