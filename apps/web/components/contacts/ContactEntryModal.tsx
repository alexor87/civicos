'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Zap, ClipboardList } from 'lucide-react'
import { QuickAddModal } from './QuickAddModal'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
}

export function ContactEntryModal({ open, onOpenChange, campaignId }: Props) {
  const router = useRouter()
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  if (showQuickAdd) {
    return (
      <QuickAddModal
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShowQuickAdd(false)
            onOpenChange(false)
          }
        }}
        campaignId={campaignId}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Añadir contacto</DialogTitle>
          <DialogDescription>Elige cómo agregar el contacto</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:bg-slate-50 hover:border-slate-300"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 flex-shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Captura rápida</p>
              <p className="text-xs text-slate-500">Nombre y teléfono — 15 segundos</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenChange(false)
              router.push('/dashboard/contacts/new')
            }}
            className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:bg-slate-50 hover:border-slate-300"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Ficha completa</p>
              <p className="text-xs text-slate-500">Formulario completo en 4 pasos</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
