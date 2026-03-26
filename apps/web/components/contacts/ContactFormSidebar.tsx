'use client'

import { useFormContext } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagInput } from '@/components/contacts/selectors/TagInput'
import type { ContactForm } from '@/lib/schemas/contact-form'

interface Props {
  currentStep: number
}

export function ContactFormSidebar({ currentStep }: Props) {
  const { register, watch, setValue } = useFormContext<ContactForm>()

  // Parse tags from comma-separated string
  const tagsString = watch('tags') ?? ''
  const tagsArray = tagsString ? tagsString.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div className="space-y-4">
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
            <SummaryLine label="Nombre" value={`${watch('first_name')} ${watch('last_name')}`} />
            <SummaryLine label="Teléfono" value={watch('phone')} />
            {currentStep > 2 && (
              <>
                <SummaryLine label="Departamento" value={watch('department')} />
                <SummaryLine label="Municipio" value={watch('municipality')} />
              </>
            )}
            {currentStep > 3 && (
              <SummaryLine label="Afinidad" value={
                watch('political_affinity') ? `${watch('political_affinity')}/5` : undefined
              } />
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
