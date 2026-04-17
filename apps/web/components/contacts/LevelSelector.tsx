'use client'

import { CheckCircle, MessageCircle, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContactLevel } from '@/lib/schemas/contact-form'

const LEVELS = [
  {
    value: 'completo' as const,
    label: 'Completo',
    description: 'Contacto con datos completos',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgSelected: 'bg-emerald-50 border-emerald-300 ring-emerald-200',
  },
  {
    value: 'opinion' as const,
    label: 'Opinión',
    description: 'Solo nombre y opinión política',
    icon: MessageCircle,
    color: 'text-blue-600',
    bgSelected: 'bg-blue-50 border-blue-300 ring-blue-200',
  },
  {
    value: 'anonimo' as const,
    label: 'Anónimo',
    description: 'Voto anónimo, sin datos personales',
    icon: EyeOff,
    color: 'text-slate-500',
    bgSelected: 'bg-slate-50 border-slate-300 ring-slate-200',
  },
]

interface Props {
  value?: ContactLevel
  onSelect: (level: ContactLevel) => void
}

export function LevelSelector({ value, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          ¿Qué tipo de contacto vas a registrar?
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Selecciona el nivel de información que tienes disponible
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LEVELS.map((level) => {
          const selected = value === level.value
          const Icon = level.icon
          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onSelect(level.value)}
              className={cn(
                'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center',
                selected
                  ? cn(level.bgSelected, 'ring-2 shadow-sm')
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              )}
            >
              <Icon className={cn('h-8 w-8', selected ? level.color : 'text-slate-400')} />
              <div>
                <p className={cn('font-semibold', selected ? 'text-slate-900' : 'text-slate-700')}>
                  {level.label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{level.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
