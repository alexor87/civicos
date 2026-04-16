'use client'

import { cn } from '@/lib/utils'

const ORIENTATIONS = [
  { value: 'derecha', label: 'Derecha' },
  { value: 'centro', label: 'Centro' },
  { value: 'izquierda', label: 'Izquierda' },
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
      className="flex gap-2 w-full"
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
              'flex-1 h-12 rounded-lg text-sm font-medium transition-all',
              selected
                ? 'bg-primary text-white ring-2 ring-primary/30 shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
