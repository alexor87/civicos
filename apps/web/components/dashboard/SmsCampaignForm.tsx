'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SmsCharCounter } from './SmsCharCounter'
import { Loader2, Save } from 'lucide-react'

interface Props {
  segments: { id: string; name: string }[]
  action: (formData: FormData) => Promise<void>
  defaultValues?: {
    name?: string
    body_text?: string
    segment_id?: string
  }
}

export function SmsCampaignForm({ segments, action, defaultValues }: Props) {
  const [isPending, setIsPending] = useState(false)
  const [bodyText, setBodyText]   = useState(defaultValues?.body_text ?? '')

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    await action(formData)
    setIsPending(false)
  }

  return (
    <form action={handleSubmit} className="bg-white border border-[#dcdee6] rounded-md p-6 space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre de la campaña</Label>
        <Input
          id="name"
          name="name"
          placeholder="ej. Recordatorio votaciones julio"
          defaultValue={defaultValues?.name ?? ''}
          required
        />
      </div>

      {/* Segment */}
      <div className="space-y-1.5">
        <Label htmlFor="segment_id">Segmento de destinatarios</Label>
        <Select name="segment_id" defaultValue={defaultValues?.segment_id ?? ''}>
          <SelectTrigger id="segment_id">
            <SelectValue placeholder="Todos los contactos con teléfono" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los contactos con teléfono</SelectItem>
            {segments.map(seg => (
              <SelectItem key={seg.id} value={seg.id}>{seg.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Body text */}
      <div className="space-y-1.5">
        <Label htmlFor="body_text">Mensaje SMS</Label>
        <Textarea
          id="body_text"
          name="body_text"
          placeholder="Hola {nombre}, te invitamos a participar en..."
          rows={5}
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          required
        />
        <SmsCharCounter value={bodyText} />
        <p className="text-xs text-[#6a737d]">
          Usa <code className="bg-[#f6f7f8] px-1 rounded">{'{nombre}'}</code> y{' '}
          <code className="bg-[#f6f7f8] px-1 rounded">{'{apellido}'}</code> para personalizar el mensaje.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending} className="bg-[#2960ec] hover:bg-[#0a41cc] gap-2">
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
          ) : (
            <><Save className="h-4 w-4" /> Guardar borrador</>
          )}
        </Button>
      </div>
    </form>
  )
}
