'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContactSearchInput } from '@/components/contacts/selectors/ContactSearchInput'
import type { ContactForm } from '@/lib/schemas/contact-form'

interface StepAdditionalProps {
  campaignId?: string
}

export function StepAdditional({ campaignId }: StepAdditionalProps) {
  const { register, setValue, watch } = useFormContext<ContactForm>()

  return (
    <div className="space-y-5">
      {/* Demographics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="birth_date">Fecha de nacimiento</Label>
          <Input id="birth_date" type="date" {...register('birth_date')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">Género</Label>
          <Select
            value={watch('gender') ?? ''}
            onValueChange={(v) => setValue('gender', v as ContactForm['gender'])}
          >
            <SelectTrigger id="gender" className="w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Femenino</SelectItem>
              <SelectItem value="NB">No binario</SelectItem>
              <SelectItem value="NE">Prefiero no decir</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="marital_status">Estado civil</Label>
          <Select
            value={watch('marital_status') ?? ''}
            onValueChange={(v) => setValue('marital_status', v as ContactForm['marital_status'])}
          >
            <SelectTrigger id="marital_status" className="w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soltero">Soltero/a</SelectItem>
              <SelectItem value="casado">Casado/a</SelectItem>
              <SelectItem value="union_libre">Unión libre</SelectItem>
              <SelectItem value="divorciado">Divorciado/a</SelectItem>
              <SelectItem value="viudo">Viudo/a</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Source */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact_source">Fuente de captura</Label>
          <Select
            value={watch('contact_source') ?? ''}
            onValueChange={(v) => setValue('contact_source', v as ContactForm['contact_source'])}
          >
            <SelectTrigger id="contact_source" className="w-full">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="puerta_a_puerta">Puerta a puerta</SelectItem>
              <SelectItem value="evento">Evento</SelectItem>
              <SelectItem value="referido">Referido</SelectItem>
              <SelectItem value="formulario_web">Formulario web</SelectItem>
              <SelectItem value="importado">Base importada</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="source_detail">Detalle de fuente</Label>
          <Input id="source_detail" placeholder="Brigada barrio Estadio" {...register('source_detail')} />
        </div>
      </div>

      {/* Strategic */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="referred_by">Líder que refiere</Label>
          {campaignId ? (
            <ContactSearchInput
              value={watch('referred_by') ?? ''}
              onChange={(v) => setValue('referred_by', v)}
              campaignId={campaignId}
              placeholder="Buscar líder..."
            />
          ) : (
            <Input id="referred_by" placeholder="Ana Gómez" {...register('referred_by')} />
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mobilizes_count">Votos que moviliza</Label>
          <Input
            id="mobilizes_count"
            type="number"
            min="0"
            placeholder="0"
            {...register('mobilizes_count', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="main_need">Necesidad principal</Label>
          <Input id="main_need" placeholder="Empleo, salud, vivienda..." {...register('main_need')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="economic_sector">Sector económico</Label>
          <Input id="economic_sector" placeholder="Transporte, comercio..." {...register('economic_sector')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="beneficiary_program">Beneficiario de programa</Label>
        <Input id="beneficiary_program" placeholder="Familias en acción, Ser Pilo Paga..." {...register('beneficiary_program')} />
      </div>
    </div>
  )
}
