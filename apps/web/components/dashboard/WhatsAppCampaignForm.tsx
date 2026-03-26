'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, Info } from 'lucide-react'

interface Props {
  segments: { id: string; name: string }[]
  action: (formData: FormData) => Promise<void>
  defaultValues?: {
    name?: string
    template_name?: string
    segment_id?: string
  }
}

export function WhatsAppCampaignForm({ segments, action, defaultValues }: Props) {
  const [isPending, setIsPending] = useState(false)

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
          placeholder="ej. Invitación evento julio"
          defaultValue={defaultValues?.name ?? ''}
          required
        />
      </div>

      {/* Template name */}
      <div className="space-y-1.5">
        <Label htmlFor="template_name">Nombre del template de WhatsApp</Label>
        <Input
          id="template_name"
          name="template_name"
          placeholder="ej. hello_world"
          defaultValue={defaultValues?.template_name ?? ''}
          required
        />
        <div className="flex items-start gap-1.5 text-xs text-[#6a737d] bg-muted rounded-md p-2.5">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[#2960ec]" />
          <span>
            Este es el <strong>Content SID</strong> del template aprobado por Meta en tu cuenta Twilio.
            Los templates deben estar pre-aprobados por WhatsApp antes de enviar.
          </span>
        </div>
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

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar borrador
        </Button>
      </div>
    </form>
  )
}
