'use client'

import { CheckCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { ShareButton } from '@/components/ShareButton'

interface ConfirmationContentProps {
  config: {
    primary_color: string
    referral_enabled: boolean
    title: string | null
  }
  referralLink: string
  slug: string
  isExisting: boolean
  code: string
}

export function ConfirmationContent({
  config,
  referralLink,
  slug,
  isExisting,
  code,
}: ConfirmationContentProps) {
  return (
    <>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: `${config.primary_color}15` }}
      >
        <CheckCircle
          className="w-8 h-8"
          style={{ color: config.primary_color }}
        />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {isExisting ? '¡Ya estabas registrado!' : '¡Registro exitoso!'}
      </h1>

      <p className="text-slate-600 mb-6">
        {isExisting
          ? 'Ya eres parte del equipo. Comparte tu enlace para sumar más personas.'
          : 'Gracias por unirte. Tu apoyo hace la diferencia.'}
      </p>

      {config.referral_enabled && code && (
        <>
          <div className="border-t border-slate-200 pt-6 mt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Invita a más personas
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Comparte tu enlace personal y ayuda a crecer el movimiento.
            </p>
            <ShareButton
              referralLink={referralLink}
              slug={slug}
              primaryColor={config.primary_color}
            />
          </div>

          <Link
            href={`/${slug}/mis-referidos`}
            className="inline-flex items-center gap-2 mt-6 text-sm font-medium hover:underline"
            style={{ color: config.primary_color }}
          >
            <Users className="w-4 h-4" />
            Ver mis referidos y ranking
          </Link>
        </>
      )}
    </>
  )
}
