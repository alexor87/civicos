'use client'

import { useOnboardingState } from '@/lib/hooks/useOnboardingState'
import { Beaker, ArrowRight, X, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

interface DemoBannerProps {
  tenantId: string
}

export function DemoBanner({ tenantId }: DemoBannerProps) {
  const { isDemo, isPendingApproval, daysInDemo, rejectionReason, isLoading } = useOnboardingState(tenantId)
  const [dismissed, setDismissed] = useState(false)

  if (isLoading || dismissed) return null

  // Pending approval: blue banner, no action
  if (isPendingApproval) {
    return (
      <div className="relative z-40 flex items-center gap-2 px-4 py-2.5 text-sm bg-blue-50 border-b border-blue-100 text-blue-900">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          Tu solicitud de activación está en revisión. Te avisaremos cuando esté lista.
        </span>
      </div>
    )
  }

  if (!isDemo) return null

  // Rejected (back to demo with reason): red banner with re-submit
  if (rejectionReason) {
    return (
      <div className="relative z-40 flex items-center justify-between gap-3 px-4 py-2.5 text-sm bg-red-50 border-b border-red-100 text-red-900">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            Tu solicitud fue rechazada: {rejectionReason}
          </span>
        </div>
        <Link href="/onboarding/activate" className="flex-shrink-0">
          <Button size="sm" className="gap-1.5 h-7 text-xs bg-red-600 hover:bg-red-700 text-white">
            Editar y reenviar
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    )
  }

  // Default demo banner
  const isUrgent = daysInDemo >= 4

  return (
    <div
      className={`relative z-40 flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        isUrgent
          ? 'bg-amber-100 border-b border-amber-200 text-amber-900'
          : 'bg-amber-50 border-b border-amber-100 text-amber-800'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Beaker className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          {isUrgent
            ? `Llevas ${daysInDemo} días explorando con datos de ejemplo`
            : 'Explorando con datos de ejemplo'}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/onboarding/activate">
          <Button
            size="sm"
            className={`gap-1.5 h-7 text-xs ${
              isUrgent
                ? 'bg-amber-700 hover:bg-amber-800 text-white'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            Activar mi campaña real
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
        {!isUrgent && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition-colors"
            aria-label="Cerrar banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
