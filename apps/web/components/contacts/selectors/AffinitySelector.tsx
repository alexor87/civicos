'use client'

import { cn } from '@/lib/utils'

const LEVELS = [
  { value: 1, label: 'Opositor', color: 'bg-red-500 text-white', ring: 'ring-red-500/30' },
  { value: 2, label: 'Escéptico', color: 'bg-orange-400 text-white', ring: 'ring-orange-400/30' },
  { value: 3, label: 'Neutro', color: 'bg-yellow-400 text-gray-900', ring: 'ring-yellow-400/30' },
  { value: 4, label: 'Simpatizante', color: 'bg-emerald-400 text-white', ring: 'ring-emerald-400/30' },
  { value: 5, label: 'Aliado', color: 'bg-green-600 text-white', ring: 'ring-green-600/30' },
] as const

interface Props {
  value: number | null
  onChange: (value: number | null) => void
  size?: 'sm' | 'md' | 'lg'
}

export function AffinitySelector({ value, onChange, size = 'md' }: Props) {
  const heights = { sm: 'h-9', md: 'h-12', lg: 'h-16' }
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

  return (
    <div
      role="radiogroup"
      aria-label="Afinidad política"
      data-size={size}
      className="flex gap-2 w-full"
    >
      {LEVELS.map((level) => {
        const selected = value === level.value
        return (
          <button
            key={level.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : level.value)}
            className={cn(
              'flex-1 rounded-lg font-medium transition-all',
              heights[size],
              textSizes[size],
              selected
                ? cn(level.color, 'ring-2', level.ring, 'shadow-sm')
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            {level.label}
          </button>
        )
      })}
    </div>
  )
}
