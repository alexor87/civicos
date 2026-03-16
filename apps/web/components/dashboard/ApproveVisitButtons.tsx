'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle } from 'lucide-react'

export function ApproveVisitButtons({ visitId }: { visitId: string }) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')

  if (rejecting) {
    return (
      <div className="flex flex-col gap-1.5">
        <Input
          placeholder="Motivo del rechazo…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="h-7 text-xs w-48"
          autoFocus
        />
        <div className="flex gap-1">
          <form action="/api/canvassing/approve" method="POST" className="flex gap-1">
            <input type="hidden" name="visitId" value={visitId} />
            <input type="hidden" name="action" value="reject" />
            <input type="hidden" name="rejection_reason" value={reason} />
            <Button type="submit" size="sm" variant="destructive" className="h-7 text-xs px-2">
              Confirmar
            </Button>
          </form>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-2"
            onClick={() => setRejecting(false)}
          >
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <form action="/api/canvassing/approve" method="POST">
        <input type="hidden" name="visitId" value={visitId} />
        <input type="hidden" name="action" value="approve" />
        <Button type="submit" size="sm" variant="outline" className="h-7 text-xs px-2 text-green-600 border-green-200 hover:bg-green-50">
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Aprobar
        </Button>
      </form>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 text-xs px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() => setRejecting(true)}
      >
        <XCircle className="h-3.5 w-3.5 mr-1" />
        Rechazar
      </Button>
    </div>
  )
}
