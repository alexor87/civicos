'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { sendCampaign } from '@/app/dashboard/comunicaciones/actions'

interface Props {
  campaignId: string
  recipientCount: number
}

export function SendCampaignButton({ campaignId, recipientCount }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await sendCampaign(campaignId)
      if (result && 'error' in result) {
        toast.error(result.error)
        setOpen(false)
      } else if (result && 'sent' in result) {
        toast.success(`Enviado a ${result.sent} contacto${result.sent !== 1 ? 's' : ''}${result.failed > 0 ? ` · ${result.failed} fallidos` : ''}`)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button className="gap-2" />}>
        <Send className="h-4 w-4" />
        Enviar campaña
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmas el envío?</AlertDialogTitle>
          <AlertDialogDescription render={<div className="space-y-3" />}>
            <p>
              Estás a punto de enviar este email a{' '}
              <span className="font-semibold text-[#1b1f23]">
                {recipientCount > 0 ? `${recipientCount} contactos` : 'todos los contactos con email'}
              </span>.
            </p>
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded px-3 py-2.5 text-sm text-orange-700">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>Esta acción no se puede deshacer. Los destinatarios recibirán el email inmediatamente.</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleConfirm() }}
            disabled={isPending}
            className="bg-[#2960ec] hover:bg-[#0a41cc] gap-2"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
            ) : (
              <><Send className="h-4 w-4" /> Sí, enviar ahora</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
