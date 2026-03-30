'use client'

import { useState, useEffect } from 'react'
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

type Template = { key: string; name: string; description: string | null; type: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  templates: Template[]
}

const missionSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  type: z.string().default('administrative'),
  priority: z.string().default('normal'),
  due_date: z.string().optional(),
  template_key: z.string().optional(),
})

type MissionFormValues = z.infer<typeof missionSchema>

const MISSION_TYPES = [
  { value: 'administrative', label: 'Administrativa' },
  { value: 'canvassing', label: 'Canvassing' },
  { value: 'communications', label: 'Comunicaciones' },
  { value: 'event', label: 'Evento' },
]

const PRIORITIES = [
  { value: 'low', label: 'Baja' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

function MissionForm({ campaignId, templates, onSuccess, onCancel }: {
  campaignId: string
  templates: Template[]
  onSuccess: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'administrative',
      priority: 'normal',
      due_date: '',
      template_key: '',
    },
  })

  const templateKey = watch('template_key')
  const type = watch('type')
  const priority = watch('priority')

  useEffect(() => {
    if (templateKey && templateKey.trim()) {
      const t = templates.find(t => t.key === templateKey)
      if (t) {
        setValue('name', t.name)
        setValue('description', t.description ?? '')
        setValue('type', t.type)
      }
    }
  }, [templateKey, templates, setValue])

  async function onSubmit(data: MissionFormValues) {
    setLoading(true)
    try {
      const res = await fetch('/api/operations/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          type: data.type,
          priority: data.priority,
          due_date: data.due_date || null,
          template_key: data.template_key || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al crear misión')
        return
      }
      toast.success('Misión creada')
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="contents">
      <div className="space-y-5 py-1">
        {templates.length > 0 && (
          <div className="space-y-1.5">
            <Label>Plantilla (opcional)</Label>
            <Select value={templateKey || undefined} onValueChange={v => setValue('template_key', v === ' ' ? '' : v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Crear desde cero">{templateKey && templates.find(t => t.key === templateKey)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Crear desde cero</SelectItem>
                {templates.map(t => <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="mission-name">Nombre <span className="text-red-500">*</span></Label>
          <Input id="mission-name" placeholder="Ej: Jornada de canvassing zona norte" {...register('name')} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mission-desc">Descripción</Label>
          <Textarea id="mission-desc" rows={3} placeholder="Describe el objetivo de esta misión..." {...register('description')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={v => setValue('type', v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MISSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridad</Label>
            <Select value={priority} onValueChange={v => setValue('priority', v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mission-due">Fecha límite</Label>
          <Input id="mission-due" type="date" {...register('due_date')} />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear misión'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CreateMissionModal({ open, onOpenChange, campaignId, templates }: Props) {
  const router = useRouter()

  function handleSuccess() {
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva misión</DialogTitle>
          <DialogDescription>Crea una misión para organizar tareas de tu equipo</DialogDescription>
        </DialogHeader>
        {open && (
          <MissionForm
            campaignId={campaignId}
            templates={templates}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
