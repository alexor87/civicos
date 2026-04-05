'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2 } from 'lucide-react'

interface Props {
  tenantId: string
  tenantName: string
}

export function ApprovalActions({ tenantId, tenantName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleApprove() {
    if (!confirm(`¿Aprobar la activación de "${tenantName}"? Se creará la campaña real y se borrará la demo.`)) return
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/approvals/${tenantId}/approve`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Error al aprobar')
        return
      }
      router.refresh()
    })
  }

  function handleReject() {
    if (!reason.trim()) {
      setError('Ingresa un motivo')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/approvals/${tenantId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? 'Error al rechazar')
        return
      }
      setShowReject(false)
      setReason('')
      router.refresh()
    })
  }

  if (showReject) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo del rechazo"
          className="text-xs px-2 py-1 rounded-md border border-border bg-background w-48"
          autoFocus
          disabled={isPending}
        />
        <button
          onClick={handleReject}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
        </button>
        <button
          onClick={() => { setShowReject(false); setReason(''); setError(null) }}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded-md border border-border hover:bg-accent disabled:opacity-50"
        >
          Cancelar
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      {error && <span className="text-xs text-red-600 mr-2">{error}</span>}
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
        Aprobar
      </button>
      <button
        onClick={() => setShowReject(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border border-border text-foreground hover:bg-accent disabled:opacity-50"
      >
        <X className="w-3 h-3" />
        Rechazar
      </button>
    </div>
  )
}
