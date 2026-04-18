'use client'

import { useEffect, useState, useMemo } from 'react'
import { CheckCircle, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { ShareButton } from '@/components/ShareButton'

interface ConfirmationContentProps {
  config: {
    primary_color: string
    referral_enabled: boolean
    title: string | null
    registration_count?: number
  }
  referralLink: string
  slug: string
  isExisting: boolean
  code: string
}

function Confetti({ primaryColor }: { primaryColor: string }) {
  const pieces = useMemo(() => {
    const colors = [primaryColor, '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 2}s`,
      duration: `${2 + Math.random() * 3}s`,
      size: `${6 + Math.random() * 8}px`,
    }))
  }, [primaryColor])

  return (
    <div className="confetti-active fixed inset-0 pointer-events-none z-50">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  )
}

function AnimatedNumber({ target }: { target: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target <= 0) return
    const duration = 1200
    const steps = 30
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [target])

  return <span className="tabular-nums">{count.toLocaleString('es-CO')}</span>
}

export function ConfirmationContent({
  config,
  referralLink,
  slug,
  isExisting,
  code,
}: ConfirmationContentProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const registrationCount = config.registration_count ?? 0

  useEffect(() => {
    if (!isExisting) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [isExisting])

  return (
    <>
      {showConfetti && <Confetti primaryColor={config.primary_color} />}

      {/* Success icon */}
      <div className="animate-scale-in">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: `${config.primary_color}15` }}
        >
          <CheckCircle
            className="w-10 h-10"
            style={{ color: config.primary_color }}
          />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 animate-fade-in-up">
        {isExisting ? '¡Ya eras parte!' : '¡Bienvenido/a al movimiento!'}
      </h1>

      {/* Person number */}
      {registrationCount > 0 && !isExisting && (
        <div className="animate-fade-in-up-delay-1">
          <p className="text-lg text-slate-600 mb-1">
            Eres la persona{' '}
            <span className="font-bold" style={{ color: config.primary_color }}>
              #<AnimatedNumber target={registrationCount} />
            </span>
            {' '}en unirse
          </p>
        </div>
      )}

      <p className="text-slate-500 mb-6 animate-fade-in-up-delay-1">
        {isExisting
          ? 'Ya eres parte del equipo. Comparte tu enlace para sumar más personas.'
          : 'Gracias por unirte. Tu apoyo hace la diferencia.'}
      </p>

      {/* Impact multiplier */}
      {registrationCount > 0 && !isExisting && (
        <div
          className="rounded-xl p-4 mb-6 animate-fade-in-up-delay-2"
          style={{ backgroundColor: `${config.primary_color}08` }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: config.primary_color }} />
            <span className="text-sm font-semibold" style={{ color: config.primary_color }}>
              Efecto multiplicador
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Si cada uno de nosotros invita a 3 personas, seremos{' '}
            <span className="font-bold">{(registrationCount * 3).toLocaleString('es-CO')}</span>
          </p>
        </div>
      )}

      {/* Referral section */}
      {config.referral_enabled && code && (
        <div className="animate-fade-in-up-delay-3">
          <div className="border-t border-slate-200 pt-6 mt-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
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
        </div>
      )}
    </>
  )
}
