'use client'

import { useState } from 'react'
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
import { StatusBigButtons } from '@/components/contacts/selectors/StatusBigButtons'
import { ChevronDown } from 'lucide-react'
import type { ContactForm, ContactLevel } from '@/lib/schemas/contact-form'

interface Props {
  campaignId: string
  contactLevel?: ContactLevel
}

export function StepEssentials({ campaignId, contactLevel = 'completo' }: Props) {
  const { register, setValue, watch, formState: { errors } } = useFormContext<ContactForm>()
  const [showExtra, setShowExtra] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  const isOpinion = contactLevel === 'opinion'
  const status = watch('status')
  const docNumberRegister = register('document_number')

  const checkDuplicate = async (docNumber: string) => {
    if (!docNumber || !campaignId) return
    try {
      const res = await fetch(`/api/contacts/check-duplicate?document_number=${encodeURIComponent(docNumber)}&campaign_id=${encodeURIComponent(campaignId)}`)
      const data = await res.json()
      if (data.duplicate) {
        setDuplicateWarning(`Ya existe: ${data.contact.first_name} ${data.contact.last_name}`)
      } else {
        setDuplicateWarning(null)
      }
    } catch {
      // Silently ignore
    }
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="first_name">Nombre <span className="text-red-500">*</span></Label>
          <Input id="first_name" placeholder="Juan" {...register('first_name')} />
          {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="last_name">Apellido <span className="text-red-500">*</span></Label>
          <Input id="last_name" placeholder="García" {...register('last_name')} />
          {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
        </div>
      </div>

      {/* Document — optional for opinion */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="document_type">
            Tipo doc. {!isOpinion && <span className="text-red-500">*</span>}
            {isOpinion && <span className="text-slate-400 text-xs">(Opcional)</span>}
          </Label>
          <Select
            value={watch('document_type') ?? ''}
            onValueChange={(v) => setValue('document_type', v as ContactForm['document_type'])}
          >
            <SelectTrigger id="document_type" className="w-full">
              <SelectValue placeholder="CC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CC">CC</SelectItem>
              <SelectItem value="CE">CE</SelectItem>
              <SelectItem value="TI">TI</SelectItem>
              <SelectItem value="Pasaporte">Pasaporte</SelectItem>
            </SelectContent>
          </Select>
          {errors.document_type && <p className="text-xs text-red-500">{errors.document_type.message}</p>}
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="document_number">
            Número de documento {!isOpinion && <span className="text-red-500">*</span>}
            {isOpinion && <span className="text-slate-400 text-xs">(Opcional)</span>}
          </Label>
          <Input
            id="document_number"
            placeholder="1023456789"
            {...docNumberRegister}
            onBlur={(e) => {
              docNumberRegister.onBlur(e)
              if (e.target.value) checkDuplicate(e.target.value)
            }}
          />
          {errors.document_number && <p className="text-xs text-red-500">{errors.document_number.message}</p>}
          {duplicateWarning && (
            <p className="text-xs text-amber-600 font-medium">{duplicateWarning}</p>
          )}
        </div>
      </div>

      {/* Phone — optional for opinion */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">
          Teléfono móvil {!isOpinion && <span className="text-red-500">*</span>}
          {isOpinion && <span className="text-slate-400 text-xs">(Opcional)</span>}
        </Label>
        <Input id="phone" type="tel" placeholder="3104567890" {...register('phone')} />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <Label>Estado del contacto</Label>
        <StatusBigButtons
          value={status ?? 'unknown'}
          onChange={(v) => setValue('status', v)}
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">
          Correo electrónico {!isOpinion && <span className="text-red-500">*</span>}
          {isOpinion && <span className="text-slate-400 text-xs">(Opcional)</span>}
        </Label>
        <Input id="email" type="email" placeholder="juan@ejemplo.com" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      {/* Collapsible extra fields — hide for opinion to keep it simple */}
      {!isOpinion && (
        <>
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showExtra ? 'rotate-180' : ''}`} />
            Teléfono alterno
          </button>

          {showExtra && (
            <div className="space-y-1.5">
              <Label htmlFor="phone_alternate">Teléfono alterno</Label>
              <Input id="phone_alternate" type="tel" placeholder="3114567890" {...register('phone_alternate')} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
