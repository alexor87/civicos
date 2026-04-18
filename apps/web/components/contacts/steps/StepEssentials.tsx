'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBigButtons } from '@/components/contacts/selectors/StatusBigButtons'
import { ChevronDown, Merge, Loader2 } from 'lucide-react'
import type { ContactForm, ContactLevel } from '@/lib/schemas/contact-form'

interface Props {
  campaignId: string
  contactLevel?: ContactLevel
  contactId?: string
}

export function StepEssentials({ campaignId, contactLevel = 'completo', contactId }: Props) {
  const router = useRouter()
  const { register, setValue, watch, formState: { errors } } = useFormContext<ContactForm>()
  const [showExtra, setShowExtra] = useState(false)
  const [duplicateContact, setDuplicateContact] = useState<{ id: string; name: string } | null>(null)
  const [merging, setMerging] = useState(false)

  const isOpinion = contactLevel === 'opinion'
  const status = watch('status')
  const docNumberRegister = register('document_number')

  const checkDuplicate = async (docNumber: string) => {
    if (!docNumber || !campaignId) return
    try {
      const params = new URLSearchParams({
        document_number: docNumber,
        campaign_id: campaignId,
      })
      if (contactId) params.set('exclude_id', contactId)

      const res = await fetch(`/api/contacts/check-duplicate?${params}`)
      const data = await res.json()
      if (data.duplicate) {
        setDuplicateContact({
          id: data.contact.id,
          name: `${data.contact.first_name} ${data.contact.last_name}`,
        })
      } else {
        setDuplicateContact(null)
      }
    } catch {
      // Silently ignore
    }
  }

  const handleMerge = async () => {
    if (!duplicateContact || !contactId) return
    setMerging(true)
    try {
      const res = await fetch('/api/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: contactId,
          targetId: duplicateContact.id,
        }),
      })
      const data = await res.json()
      if (res.ok && data.mergedId) {
        toast.success('Contactos fusionados correctamente')
        router.push(`/dashboard/contacts/${data.mergedId}`)
        router.refresh()
      } else {
        toast.error('Error al fusionar los contactos')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setMerging(false)
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
          {duplicateContact && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-800">
                Ya existe <span className="font-semibold">{duplicateContact.name}</span> con esta cédula.
              </p>
              {contactId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={handleMerge}
                  disabled={merging}
                >
                  {merging ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Merge className="h-3.5 w-3.5" />
                  )}
                  Fusionar contactos
                </Button>
              )}
            </div>
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
