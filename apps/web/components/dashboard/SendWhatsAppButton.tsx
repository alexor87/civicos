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
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { sendWhatsAppCampaign } from '@/app/dashboard/comunicaciones/whatsapp-actions'

interface Props {
  campaignId: string
  recipientCount: number
}

export function SendWhatsAppButton({ campaignId, recipientCount }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await sendWhatsAppCampaign(campaignId)
      if (result && 'error' in result) {
        toast.error(result.error)
        setOpen(false)
      } else if (result && 'sent' in result) {
        toast.success(
          `Enviado a ${result.sent} contacto${result.sent !== 1 ? 's' : ''}` +
          (result.failed > 0 ? ` · ${result.failed} fallidos` : '')
        )
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button className="gap-2 bg-[#25D366] hover:bg-[#1da851] text-white" />}>
        <MessageSquare className="h-4 w-4" />
        Enviar WhatsApp
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmas el envío?</AlertDialogTitle>
          <AlertDialogDescription render={<div className="space-y-3" />}>
            <p>
              Estás a punto de enviar este template de WhatsApp a{' '}
              <span className="font-semibold text-[#1b1f23]">
                {recipientCount > 0 ? `${recipientCount} contactos` : 'todos los contactos con teléfono'}
              </span>.
            </p>
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded px-3 py-2.5 text-sm text-orange-700">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>
                Esta acción no se puede deshacer. Los mensajes se enviarán vía WhatsApp Business inmediatamente.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleConfirm() }}
            disabled={isPending}
            className="bg-[#25D366] hover:bg-[#1da851] gap-2"
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
