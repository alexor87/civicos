'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Loader2, Mail, CheckCircle2 } from 'lucide-react'

const COOLDOWN_SECONDS = 60

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [cooldown, setCooldown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  async function handleResend() {
    if (!email || cooldown > 0 || loading) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'No se pudo reenviar' })
      } else {
        setMessage({ type: 'success', text: 'Email reenviado. Revisa tu bandeja.' })
        setCooldown(COOLDOWN_SECONDS)
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout tagline="Explora gratis con datos de ejemplo">
      <div className="space-y-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50">
          <Mail className="h-6 w-6 text-[#2262ec]" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Revisa tu correo</h1>
          <p className="text-slate-500 text-sm mt-2">
            Te enviamos un link de confirmación a{' '}
            <span className="font-medium text-slate-900">{email || 'tu email'}</span>.
            Ábrelo para activar tu cuenta.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            ¿No lo ves? Revisa tu carpeta de spam o reenvíalo desde aquí.
          </p>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 text-sm p-3 rounded-md border ${
              message.type === 'success'
                ? 'text-green-700 bg-green-50 border-green-200'
                : 'text-red-600 bg-red-50 border-red-200'
            }`}
          >
            {message.type === 'success' && <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <Button
          type="button"
          className="w-full"
          variant="outline"
          disabled={loading || cooldown > 0 || !email}
          onClick={handleResend}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Enviando...
            </>
          ) : cooldown > 0 ? (
            `Reenviar en ${cooldown}s`
          ) : (
            'Reenviar email'
          )}
        </Button>

        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            Volver al login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
