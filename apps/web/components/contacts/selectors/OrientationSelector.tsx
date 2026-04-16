'use client'

import { cn } from '@/lib/utils'

const ORIENTATIONS = [
  { value: 'derecha', label: 'Derecha', icon: '→' },
  { value: 'centro', label: 'Centro', icon: '•' },
  { value: 'izquierda', label: 'Izquierda', icon: '←' },
] as const

interface Props {
  value: string | null
  onChange: (value: string | null) => void
}

export function OrientationSelector({ value, onChange }: Props) {
  return (
    <div
      role="radiogroup"
      aria-label="Orientación política"
      className="grid grid-cols-3 gap-3"
    >
      {ORIENTATIONS.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : o.value)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-4 text-sm font-medium transition-all',
              selected
                ? 'border-primary bg-primary/5 text-primary shadow-sm'
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <span className="text-lg">{o.icon}</span>
            <span>{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
