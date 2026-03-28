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
import { toast } from 'sonner'

type Template = { key: string; name: string; description: string | null; type: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  templates: Template[]
}

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

const selectClass = 'w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring'

export function CreateMissionModal({ open, onOpenChange, campaignId, templates }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('administrative')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [templateKey, setTemplateKey] = useState('')

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
              <select
                value={templateKey}
                onChange={e => handleTemplateChange(e.target.value)}
                className={selectClass}
              >
                <option value="">Crear desde cero</option>
                {templates.map(t => (
                  <option key={t.key} value={t.key}>{t.name}</option>
                ))}
              </select>
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
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className={selectClass}
              >
                {MISSION_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Prioridad</Label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={selectClass}
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
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
