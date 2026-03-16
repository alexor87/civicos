'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface ContactPoint {
  id: string
  lat: number
  lng: number
  last_result: string | null
  status: string | null
  vote_intention: string | null
  campaign_role: string | null
  electoral_priority: string | null
  capture_source: string | null
}

export type ColorMode = 'visit_result' | 'status' | 'vote_intention' | 'electoral_priority' | 'campaign_role' | 'capture_source'

export type FilterKey = 'status' | 'vote_intention' | 'campaign_role' | 'electoral_priority' | 'capture_source'

// ─── Color palettes ──────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, string> = {
  supporter: '#22c55e',
  undecided: '#eab308',
  opponent:  '#ef4444',
  unknown:   '#94a3b8',
}
export const STATUS_LABELS: Record<string, string> = {
  supporter: 'Simpatizante',
  undecided: 'Indeciso',
  opponent:  'Opositor',
  unknown:   'Sin datos',
}

export const VOTE_COLORS: Record<string, string> = {
  si:      '#22c55e',
  no:      '#ef4444',
  indeciso:'#eab308',
}
export const VOTE_LABELS: Record<string, string> = {
  si:      'Sí',
  no:      'No',
  indeciso:'Indeciso',
}

export const PRIORITY_COLORS: Record<string, string> = {
  alta:  '#ef4444',
  media: '#f97316',
  baja:  '#22c55e',
}
export const PRIORITY_LABELS: Record<string, string> = {
  alta:  'Alta',
  media: 'Media',
  baja:  'Baja',
}

export const ROLE_COLORS: Record<string, string> = {
  coordinador:  '#8b5cf6',
  voluntario:   '#3b82f6',
  donante:      '#f59e0b',
  simpatizante: '#22c55e',
}
export const ROLE_LABELS: Record<string, string> = {
  coordinador:  'Coordinador',
  voluntario:   'Voluntario',
  donante:      'Donante',
  simpatizante: 'Simpatizante',
}

export const SOURCE_COLORS: Record<string, string> = {
  canvassing: '#3b82f6',
  whatsapp:   '#22c55e',
  referido:   '#8b5cf6',
  web:        '#f97316',
  evento:     '#ec4899',
}
export const SOURCE_LABELS: Record<string, string> = {
  canvassing: 'Canvassing',
  whatsapp:   'WhatsApp',
  referido:   'Referido',
  web:        'Web',
  evento:     'Evento',
}

export const RESULT_COLORS: Record<string, string> = {
  positive:        '#22c55e',
  contacted:       '#22c55e',
  negative:        '#ef4444',
  refused:         '#ef4444',
  undecided:       '#eab308',
  follow_up:       '#3b82f6',
  come_back_later: '#3b82f6',
}
export const RESULT_LABELS_PANEL: Record<string, string> = {
  positive:        'Positivo',
  contacted:       'Contactado',
  negative:        'Negativo',
  refused:         'Rehusó',
  undecided:       'Indeciso',
  follow_up:       'Seguimiento',
  come_back_later: 'Volver más tarde',
}

// ─── Dimension configs ────────────────────────────────────────────────────────

interface Dimension {
  key: FilterKey
  label: string
  field: keyof ContactPoint
  colors: Record<string, string>
  labels: Record<string, string>
}

export const DIMENSIONS: Dimension[] = [
  { key: 'status',             label: 'Estado',             field: 'status',             colors: STATUS_COLORS,   labels: STATUS_LABELS   },
  { key: 'vote_intention',     label: 'Intención de voto',  field: 'vote_intention',     colors: VOTE_COLORS,     labels: VOTE_LABELS     },
  { key: 'campaign_role',      label: 'Rol en campaña',     field: 'campaign_role',      colors: ROLE_COLORS,     labels: ROLE_LABELS     },
  { key: 'electoral_priority', label: 'Prioridad electoral',field: 'electoral_priority', colors: PRIORITY_COLORS, labels: PRIORITY_LABELS },
  { key: 'capture_source',     label: 'Fuente de captura',  field: 'capture_source',     colors: SOURCE_COLORS,   labels: SOURCE_LABELS   },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface MapFilterPanelProps {
  activeDimension: FilterKey
  setActiveDimension: (d: FilterKey) => void
  activeValues: string[]
  setActiveValues: (v: string[]) => void
  allPoints: ContactPoint[]
  filteredCount: number
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MapFilterPanel({
  activeDimension,
  setActiveDimension,
  activeValues,
  setActiveValues,
  allPoints,
  filteredCount,
}: MapFilterPanelProps) {
  const [dimOpen, setDimOpen] = useState(false)

  const dim = DIMENSIONS.find(d => d.key === activeDimension)!

  // Count per value for current dimension
  const counts: Record<string, number> = {}
  for (const p of allPoints) {
    const val = (p[dim.field] as string | null) ?? ''
    counts[val] = (counts[val] ?? 0) + 1
  }

  // Options: defined labels that have data, plus '' bucket if present
  const options: string[] = [
    ...Object.keys(dim.labels).filter(k => (counts[k] ?? 0) > 0),
    ...(counts[''] > 0 ? [''] : []),
  ]

  function toggleValue(val: string) {
    const next = activeValues.includes(val)
      ? activeValues.filter(v => v !== val)
      : [...activeValues, val]
    setActiveValues(next)
  }

  function changeDimension(d: FilterKey) {
    setActiveDimension(d)
    setActiveValues([])
    setDimOpen(false)
  }

  return (
    <div className="border-b border-[#dcdee6] bg-white">
      <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">

        {/* "Ver por" dropdown */}
        <Popover open={dimOpen} onOpenChange={setDimOpen}>
          <PopoverTrigger className="flex items-center gap-1.5 rounded-lg border border-[#2262ec]/30 bg-[#eef3ff] px-3 py-1.5 text-xs font-medium text-[#2262ec] hover:bg-[#e0eaff] transition-all duration-150 whitespace-nowrap shrink-0">
            <span className="text-[#2262ec]/60 font-normal">Ver por:</span>
            <span className="font-semibold">{dim.label}</span>
            <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${dimOpen ? 'rotate-180' : ''}`} />
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2 shadow-xl border-[#dcdee6]" align="start" sideOffset={6}>
            <p className="mb-2 px-1 text-[11px] font-semibold text-[#1b1f23] uppercase tracking-wide">Visualizar por</p>
            {DIMENSIONS.map(d => (
              <button
                key={d.key}
                onClick={() => changeDimension(d.key)}
                className={`
                  flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors
                  ${d.key === activeDimension
                    ? 'bg-[#eef3ff] font-semibold text-[#2262ec]'
                    : 'text-[#6a737d] hover:bg-[#f6f7f8]'
                  }
                `}
              >
                {d.label}
                {d.key === activeDimension && <Check className="ml-auto h-3 w-3 text-[#2262ec]" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Colored value chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {options.map(val => {
            const isActive  = activeValues.includes(val)
            const color     = val === '' ? '#94a3b8' : (dim.colors[val] ?? '#94a3b8')
            const label     = val === '' ? 'Sin datos' : (dim.labels[val] ?? val)
            const count     = counts[val] ?? 0
            const chipKey   = val === '' ? '__empty__' : val
            return (
              <button
                key={chipKey}
                onClick={() => toggleValue(val)}
                className={`
                  flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium
                  transition-all duration-150
                  ${isActive
                    ? 'text-white shadow-sm ring-1 ring-inset ring-white/20'
                    : 'bg-[#f6f7f8] text-[#444] hover:bg-[#edf0f3]'
                  }
                `}
                style={isActive ? { backgroundColor: color } : {}}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : color }}
                />
                {label}
                <span className={`text-[10px] ml-0.5 ${isActive ? 'opacity-70' : 'text-[#94a3b8]'}`}>
                  {count}
                </span>
              </button>
            )
          })}
          {options.length === 0 && (
            <span className="text-xs text-[#94a3b8]">Sin datos disponibles</span>
          )}
        </div>

        {/* Clear selection */}
        {activeValues.length > 0 && (
          <button
            onClick={() => setActiveValues([])}
            className="text-[11px] text-[#2262ec] hover:underline whitespace-nowrap shrink-0"
          >
            Ver todos
          </button>
        )}

        {/* Counter */}
        <div className="ml-auto flex items-center gap-1 rounded-full bg-[#f6f7f8] px-2.5 py-1 shrink-0">
          <span className="text-xs font-semibold text-[#1b1f23]">{filteredCount.toLocaleString()}</span>
          <span className="text-[10px] text-[#94a3b8]">/ {allPoints.length.toLocaleString()} contactos</span>
        </div>

      </div>
    </div>
  )
}
