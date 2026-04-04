'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function ImpersonateContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const returnTo = searchParams.get('return_to')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Token no proporcionado')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify-impersonation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? 'Error al verificar token')
          return
        }

        const data = await res.json()

        // Save impersonation data to sessionStorage
        const storageData = { ...data, returnTo: returnTo ?? null }
        sessionStorage.setItem('impersonation', JSON.stringify(storageData))

        // Full page reload to pick up new cookies
        window.location.href = '/dashboard'
      } catch {
        setError('Error de conexión al verificar token')
      }
    }

    verify()
  }, [token, returnTo])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="text-red-600 text-lg font-semibold">Error</div>
          <p className="text-slate-600">{error}</p>
          <button
            onClick={() => window.close()}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors"
          >
            Cerrar pestana
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
        <p className="text-slate-600 text-sm">Iniciando sesion de soporte...</p>
      </div>
    </div>
  )
}

export default function ImpersonatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <ImpersonateContent />
    </Suspense>
  )
}
