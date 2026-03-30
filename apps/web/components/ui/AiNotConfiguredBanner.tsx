'use client'

import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface AiNotConfiguredBannerProps {
  className?: string
}

export function AiNotConfiguredBanner({ className }: AiNotConfiguredBannerProps) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 ${className ?? ''}`}>
      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
      <div className="flex-1 text-sm text-amber-800">
        <span className="font-medium">Modelo de IA no configurado.</span>{' '}
        Para usar funciones de inteligencia artificial,{' '}
        <Link href="/dashboard/settings?tab=integrations" className="underline hover:text-amber-900 font-medium">
          configura tu modelo de IA en Ajustes → Integraciones
        </Link>.
      </div>
    </div>
  )
}
