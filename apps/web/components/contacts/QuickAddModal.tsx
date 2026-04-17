'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AffinitySelector } from '@/components/contacts/selectors/AffinitySelector'
import { quickAddSchema, quickAddOpinionSchema, type QuickAddForm } from '@/lib/schemas/contact-form'
import type { ContactLevel } from '@/lib/schemas/contact-form'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
}

export function QuickAddModal({ open, onOpenChange, campaignId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [level, setLevel] = useState<'completo' | 'opinion'>('completo')

  const isOpinion = level === 'opinion'

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuickAddForm>({
    resolver: zodResolver(isOpinion ? quickAddOpinionSchema : quickAddSchema),
    defaultValues: { full_name: '', phone: '' },
  })

  const affinityValue = watch('political_affinity') ?? null

  const submit = async (data: QuickAddForm, keepOpen: boolean) => {
    setSaving(true)
    try {
      // Split full_name into first_name + last_name
      const parts = data.full_name.trim().split(/\s+/)
      const first_name = parts[0] ?? ''
      const last_name = parts.slice(1).join(' ') || first_name

      const body: Record<string, unknown> = {
        first_name,
        last_name,
        status: 'unknown',
        contact_level: level,
        ...(data.political_affinity != null && {
          political_affinity: data.political_affinity,
        }),
      }

      if (isOpinion) {
        // Opinion: phone is optional
        if (data.phone) body.phone = data.phone
      } else {
        // Completo: phone + document required
        body.phone = data.phone
        body.document_type = 'CC'
        body.document_number = data.phone // Temporary: use phone as doc number for quick add
      }

      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.error === 'duplicate') {
          toast.error(isOpinion ? 'Ya existe un contacto con ese nombre' : 'Ya existe un contacto con ese teléfono')
        } else {
          toast.error('Error al crear contacto')
        }
        return
      }

      toast.success(`${first_name} ${last_name} agregado`)
      router.refresh()

      if (keepOpen) {
        reset({ full_name: '', phone: '' })
        setValue('political_affinity', undefined)
      } else {
        onOpenChange(false)
        reset()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Captura rápida</DialogTitle>
          <DialogDescription>
            {isOpinion
              ? 'Registra un voto de opinión. Solo nombre obligatorio.'
              : 'Agrega un contacto en segundos. Solo nombre y teléfono.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              !isOpinion ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setLevel('completo')}
          >
            Completo
          </button>
          <button
            type="button"
            className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${
              isOpinion ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setLevel('opinion')}
          >
            Opinión
          </button>
        </div>

        <form
          onSubmit={handleSubmit((data) => submit(data, false))}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="quick_full_name">Nombre completo <span className="text-red-500">*</span></Label>
            <Input
              id="quick_full_name"
              placeholder="Juan García López"
              autoFocus
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quick_phone">
              Teléfono {!isOpinion && <span className="text-red-500">*</span>}
              {isOpinion && <span className="text-slate-400 text-xs ml-1">(Opcional)</span>}
            </Label>
            <Input
              id="quick_phone"
              type="tel"
              placeholder="3001234567"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Afinidad política</Label>
            <AffinitySelector
              value={affinityValue ?? null}
              onChange={(val) => setValue('political_affinity', val ?? undefined)}
              size="sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={handleSubmit((data) => submit(data, true))}
            >
              Guardar y agregar otro
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar contacto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
