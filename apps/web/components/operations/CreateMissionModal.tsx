'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Megaphone, MapPin, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
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

const MISSION_TYPES = [
  { value: 'administrative', label: 'Administrativa', icon: Briefcase },
  { value: 'canvassing', label: 'Canvassing', icon: MapPin },
  { value: 'communications', label: 'Comunicaciones', icon: Megaphone },
  { value: 'event', label: 'Evento', icon: Calendar },
]

const PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'bg-slate-400' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
  { value: 'high', label: 'Alta', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-500' },
]

export function CreateMissionModal({ open, onOpenChange, campaignId, templates }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('administrative')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [templateKey, setTemplateKey] = useState('')

  const selectedType = MISSION_TYPES.find(t => t.value === type)
  const selectedPriority = PRIORITIES.find(p => p.value === priority)

  function reset() {
    setName('')
    setDescription('')
    setType('administrative')
    setPriority('normal')
    setDueDate('')
    setTemplateKey('')
  }

  function handleTemplateChange(key: string) {
    setTemplateKey(key)
    if (key && key.trim()) {
      const t = templates.find(t => t.key === key)
      if (t) {
        setName(t.name)
        setDescription(t.description ?? '')
        setType(t.type)
      }
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/operations/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          name: name.trim(),
          description: description.trim() || null,
          type,
          priority,
          due_date: dueDate || null,
          template_key: templateKey || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al crear misión')
        return
      }
      toast.success('Misión creada')
      reset()
      onOpenChange(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva misión</DialogTitle>
          <DialogDescription>Crea una misión para organizar tareas de tu equipo</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Plantilla (opcional)</Label>
              <Select value={templateKey} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Crear desde cero" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">Crear desde cero</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Nombre *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Jornada de canvassing zona norte" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe el objetivo de esta misión..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedType && (
                      <span className="flex items-center gap-2">
                        <selectedType.icon className="h-3.5 w-3.5 text-slate-500" />
                        {selectedType.label}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MISSION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <t.icon className="h-3.5 w-3.5 text-slate-500" />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedPriority && (
                      <span className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', selectedPriority.color)} />
                        {selectedPriority.label}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', p.color)} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Fecha límite</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear misión'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
