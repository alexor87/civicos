'use client'

import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagInput } from '@/components/contacts/selectors/TagInput'
import { CheckCircle, MessageCircle, EyeOff } from 'lucide-react'
import type { ContactForm, ContactLevel } from '@/lib/schemas/contact-form'

const LEVEL_BADGES: Record<ContactLevel, { label: string; icon: typeof CheckCircle; className: string }> = {
  completo: { label: 'Completo', icon: CheckCircle, className: 'text-emerald-700 bg-emerald-50' },
  opinion: { label: 'Opinión', icon: MessageCircle, className: 'text-blue-700 bg-blue-50' },
  anonimo: { label: 'Anónimo', icon: EyeOff, className: 'text-slate-600 bg-slate-100' },
}

interface Props {
  currentStep: number
  contactLevel?: ContactLevel
}

export function ContactFormSidebar({ currentStep, contactLevel = 'completo' }: Props) {
  const { register, watch, setValue } = useFormContext<ContactForm>()

  const tagsString = watch('tags') ?? ''
  const tagsArray = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : []

  const badge = LEVEL_BADGES[contactLevel]
  const BadgeIcon = badge.icon

  return (
    <div className="space-y-4">
      {/* Level badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${badge.className}`}>
        <BadgeIcon className="h-4 w-4" />
        {badge.label}
      </div>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notas</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            {...register('notes')}
            rows={5}
            placeholder="Observaciones sobre el contacto..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          <TagInput
            value={tagsArray}
            onChange={(newTags) => setValue('tags', newTags.join(', '))}
          />
        </CardContent>
      </Card>

      {/* Progressive summary */}
      {currentStep > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-1">
            {contactLevel === 'anonimo' ? (
              <p className="text-slate-500 italic">Contacto anónimo</p>
            ) : (
              <SummaryLine label="Nombre" value={`${watch('first_name') ?? ''} ${watch('last_name') ?? ''}`} />
            )}
            {contactLevel === 'completo' && (
              <SummaryLine label="Teléfono" value={watch('phone')} />
            )}
            <SummaryLine label="Departamento" value={watch('department')} />
            <SummaryLine label="Municipio" value={watch('municipality')} />
            {watch('political_affinity') && (
              <SummaryLine label="Afinidad" value={`${watch('political_affinity')}/5`} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value?: string }) {
  if (!value?.trim()) return null
  return (
    <p>
      <span className="font-medium text-slate-700">{label}:</span> {value}
    </p>
  )
}
