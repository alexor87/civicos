'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Loader2, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  tenantId: string
  tenantName: string
  currentPlan: string
  currentStatus: string
}

export function TenantActions({ tenantId, tenantName, currentPlan, currentStatus }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAction(action: string, payload?: Record<string, unknown>) {
    setLoading(true)
    await fetch(`/api/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleImpersonate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tenants/${tenantId}/impersonate`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al iniciar impersonación')
        return
      }

      window.open(data.url, '_blank')
      toast.success(`Sesión de soporte iniciada para ${tenantName}`)
      setOpen(false)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="p-2 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MoreVertical className="w-5 h-5 text-muted-foreground" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-card rounded-lg border border-border shadow-lg py-1">
            {currentStatus !== 'cancelled' && (
              <button
                onClick={handleImpersonate}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Impersonar como Super Admin
              </button>
            )}

            <div className="my-1 border-t border-border" />

            {['esencial', 'pro', 'campaign', 'enterprise'].filter(p => p !== currentPlan).map((plan) => (
              <button
                key={plan}
                onClick={() => handleAction('change_plan', { plan })}
                className="w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                Cambiar a {plan}
              </button>
            ))}

            <div className="my-1 border-t border-border" />

            {currentStatus === 'active' ? (
              <button
                onClick={() => handleAction('suspend')}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Suspender organización
              </button>
            ) : currentStatus === 'suspended' ? (
              <button
                onClick={() => handleAction('reactivate')}
                className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Reactivar organización
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
