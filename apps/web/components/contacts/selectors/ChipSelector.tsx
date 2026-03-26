'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface Props {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  label?: string
}

export function ChipSelector({ options, value, onChange, label }: Props) {
  const toggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option))
    } else {
      onChange([...value, option])
    }
  }

  return (
    <div role="group" aria-label={label ?? 'Seleccionar opciones'}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option)
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(option)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                selected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {option}
              {selected && <X className="h-3 w-3" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
