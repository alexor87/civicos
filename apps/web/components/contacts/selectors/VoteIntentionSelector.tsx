'use client'

import { cn } from '@/lib/utils'

const OPTIONS = [
  { value: 'si', label: 'Sí, votará por nosotros', color: 'bg-emerald-500 text-white', ring: 'ring-emerald-500/30' },
  { value: 'no', label: 'No votará por nosotros', color: 'bg-red-500 text-white', ring: 'ring-red-500/30' },
  { value: 'indeciso', label: 'Indeciso', color: 'bg-yellow-400 text-gray-900', ring: 'ring-yellow-400/30' },
] as const

type VoteIntention = (typeof OPTIONS)[number]['value']

interface Props {
  value: VoteIntention | null | undefined
  onChange: (value: VoteIntention | null) => void
}

export function VoteIntentionSelector({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Intención de voto" className="flex flex-col gap-2 w-full">
      {OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : option.value)}
            className={cn(
              'h-11 rounded-lg font-medium text-sm transition-all px-4 text-left',
              selected
                ? cn(option.color, 'ring-2', option.ring, 'shadow-sm')
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
