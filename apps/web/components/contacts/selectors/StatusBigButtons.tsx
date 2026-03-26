'use client'

import { cn } from '@/lib/utils'

const STATUSES = [
  { value: 'supporter', label: 'Simpatizante', color: 'bg-emerald-500 text-white', ring: 'ring-emerald-500/30' },
  { value: 'undecided', label: 'Indeciso', color: 'bg-yellow-400 text-gray-900', ring: 'ring-yellow-400/30' },
  { value: 'opponent', label: 'Opositor', color: 'bg-red-500 text-white', ring: 'ring-red-500/30' },
  { value: 'unknown', label: 'Pendiente', color: 'bg-slate-400 text-white', ring: 'ring-slate-400/30' },
] as const

type ContactStatus = (typeof STATUSES)[number]['value']

interface Props {
  value: ContactStatus
  onChange: (value: ContactStatus) => void
}

export function StatusBigButtons({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Estado del contacto"
      className="grid grid-cols-2 gap-2 w-full"
    >
      {STATUSES.map((status) => {
        const selected = value === status.value
        return (
          <button
            key={status.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(status.value)}
            className={cn(
              'h-12 rounded-xl font-medium text-sm transition-all',
              selected
                ? cn(status.color, 'ring-2', status.ring, 'shadow-sm')
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            {status.label}
          </button>
        )
      })}
    </div>
  )
}
