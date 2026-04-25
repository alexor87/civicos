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
import { ContactPicker } from './email-builder/ContactPicker'
import { Loader2, Save, Info } from 'lucide-react'

interface ManualContact {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone?: string | null
}

interface Props {
  campaignId: string
  segments: { id: string; name: string }[]
  action: (formData: FormData) => Promise<void>
  defaultValues?: {
    name?: string
    template_name?: string
    segment_id?: string
    recipient_ids?: string[]
    manual_contacts?: ManualContact[]
  }
}

const MANUAL_MODE = '__manual__'
const ALL_MODE    = '__all__'

export function WhatsAppCampaignForm({ campaignId, segments, action, defaultValues }: Props) {
  const [isPending, setIsPending] = useState(false)

  const initialManualIds = defaultValues?.recipient_ids ?? []
  const initialMode: string = initialManualIds.length > 0
    ? MANUAL_MODE
    : (defaultValues?.segment_id || ALL_MODE)

  const [mode, setMode]                = useState<string>(initialMode)
  const [manualIds, setManualIds]      = useState<string[]>(initialManualIds)
  const [manualContacts, setManualContacts] = useState<ManualContact[]>(defaultValues?.manual_contacts ?? [])

  async function handleSubmit(formData: FormData) {
    if (mode === MANUAL_MODE) {
      formData.set('segment_id', '')
      formData.set('recipient_ids', JSON.stringify(manualIds))
    } else if (mode === ALL_MODE) {
      formData.set('segment_id', '')
      formData.delete('recipient_ids')
    } else {
      formData.set('segment_id', mode)
      formData.delete('recipient_ids')
    }
    setIsPending(true)
    await action(formData)
    setIsPending(false)
  }

  return (
    <form action={handleSubmit} className="bg-white border border-[#dcdee6] rounded-md p-6 space-y-5">
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

      <div className="space-y-1.5">
        <Label htmlFor="recipient_mode">Destinatarios</Label>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger id="recipient_mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MODE}>Todos los contactos con teléfono</SelectItem>
            {segments.map(seg => (
              <SelectItem key={seg.id} value={seg.id}>{seg.name}</SelectItem>
            ))}
            <SelectItem value={MANUAL_MODE}>Selección manual</SelectItem>
          </SelectContent>
        </Select>

        {mode === MANUAL_MODE && (
          <div className="mt-2">
            <ContactPicker
              campaignId={campaignId}
              selectedIds={manualIds}
              selectedContacts={manualContacts}
              onChange={(ids, contacts) => { setManualIds(ids); setManualContacts(contacts) }}
              requireField="phone"
            />
            <p className="text-xs text-[#6a737d] mt-1">
              Solo se muestran contactos con teléfono.
              {manualIds.length > 0 && ` ${manualIds.length} seleccionado${manualIds.length === 1 ? '' : 's'}.`}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar borrador
        </Button>
      </div>
    </form>
  )
}
