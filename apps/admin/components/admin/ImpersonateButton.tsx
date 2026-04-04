'use client'

import { useState } from 'react'
import { UserRoundCog, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  tenantId: string
  tenantName: string
  tenantStatus: string
}

export function ImpersonateButton({ tenantId, tenantName, tenantStatus }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const appUrl = process.env.NEXT_PUBLIC_WEB_APP_URL ?? 'http://localhost:3000'

  async function handleConfirm() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar impersonación')
        return
      }

      const returnTo = encodeURIComponent(window.location.href)
      window.open(
        `${appUrl}/auth/impersonate?token=${data.token}&return_to=${returnTo}`,
        '_blank'
      )
      setOpen(false)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={tenantStatus === 'cancelled'}
          className="gap-2"
        >
          <UserRoundCog className="w-4 h-4" />
          Impersonar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar impersonación</DialogTitle>
          <DialogDescription>
            Vas a entrar como Super Admin de <strong>{tenantName}</strong>. La sesión
            expira en 30 minutos y quedará registrada en el log de auditoría.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
