'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X } from 'lucide-react'
import { TerritoryMapDynamic } from './TerritoryMapDynamic'
import { MapFilterPanel } from './MapFilterPanel'
import type { ContactPoint, ColorMode, FilterKey } from './MapFilterPanel'
import {
  STATUS_COLORS, STATUS_LABELS,
  VOTE_COLORS, VOTE_LABELS,
  PRIORITY_COLORS, PRIORITY_LABELS,
  ROLE_COLORS, ROLE_LABELS,
  SOURCE_COLORS, SOURCE_LABELS,
  RESULT_COLORS, RESULT_LABELS_PANEL,
  DIMENSIONS,
} from './MapFilterPanel'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Territory {
  id: string
  name: string
  color: string
  status: string
  geojson: object | null
}

interface Props {
  territories: Territory[]
  coverageData?: Record<string, number>
  visitData?: Record<string, { visits: number; estimated: number }>
  contactPoints?: ContactPoint[]
  defaultCenter?: [number, number]
  defaultZoom?: number
  onPointClick?: (point: ContactPoint) => void
}

// ── Legend items per color mode ────────────────────────────────────────────────
function getLegendItems(colorMode: ColorMode): { color: string; label: string }[] {
  switch (colorMode) {
    case 'status':
      return Object.entries(STATUS_LABELS).map(([k, label]) => ({ color: STATUS_COLORS[k] ?? '#94a3b8', label }))
    case 'vote_intention':
      return Object.entries(VOTE_LABELS).map(([k, label]) => ({ color: VOTE_COLORS[k] ?? '#94a3b8', label }))
    case 'electoral_priority':
      return Object.entries(PRIORITY_LABELS).map(([k, label]) => ({ color: PRIORITY_COLORS[k] ?? '#94a3b8', label }))
    case 'campaign_role':
      return Object.entries(ROLE_LABELS).map(([k, label]) => ({ color: ROLE_COLORS[k] ?? '#94a3b8', label }))
    case 'capture_source':
      return Object.entries(SOURCE_LABELS).map(([k, label]) => ({ color: SOURCE_COLORS[k] ?? '#94a3b8', label }))
    default:
      return Object.entries(RESULT_LABELS_PANEL).map(([k, label]) => ({ color: RESULT_COLORS[k] ?? '#94a3b8', label }))
  }
}

// ── Legend overlay (React-rendered, bottom-right of map) ──────────────────────
function MapLegend({ colorMode, hasCoverage }: { colorMode: ColorMode; hasCoverage: boolean }) {
  const items = getLegendItems(colorMode)
  return (
    <div className="absolute bottom-3 right-3 z-[800] rounded-xl bg-white/95 px-3 py-2.5 shadow-lg border border-[#dcdee6] text-[11px] backdrop-blur-sm pointer-events-none">
      {hasCoverage && (
        <>
          <p className="font-bold text-[#1b1f23] mb-1.5">Cobertura</p>
          {[
            { color: '#22c55e', label: '100% — Completo' },
            { color: '#84cc16', label: '67–99% — Alto' },
            { color: '#eab308', label: '34–66% — Medio' },
            { color: '#f97316', label: '1–33% — Bajo' },
            { color: '#ef4444', label: '0% — Sin visitas' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 mb-1">
              <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[#444]">{label}</span>
            </div>
          ))}
          <div className="my-2 border-t border-[#dcdee6]" />
        </>
      )}
      <p className="font-bold text-[#1b1f23] mb-1.5">
        {DIMENSIONS.find(d => d.key === colorMode)?.label ?? 'Contactos'}
      </p>
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5 mb-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0 border border-white shadow-[0_0_0_1px_#ccc]"
            style={{ backgroundColor: color }}
          />
          <span className="text-[#444]">{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 mt-1">
        <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0 bg-[#94a3b8] border border-white shadow-[0_0_0_1px_#ccc]" />
        <span className="text-[#444]">Sin datos</span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ExpandableMap(props: Props) {
  const [expanded,         setExpanded]         = useState(false)
  const [mounted,          setMounted]          = useState(false)
  const [activeDimension,  setActiveDimension]  = useState<FilterKey>('status')
  const [activeValues,     setActiveValues]     = useState<string[]>([])

  useEffect(() => { setMounted(true) }, [])

  // Close on Escape
  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  // colorMode derived from activeDimension
  const colorMode: ColorMode = activeDimension as ColorMode

  const allPoints = props.contactPoints ?? []

  // Client-side filter: OR within the active dimension
  const filteredPoints = useMemo(() => {
    if (activeValues.length === 0) return allPoints
    const dim = activeDimension
    return allPoints.filter(p => {
      const val = (p[dim] as string | null) ?? ''
      return activeValues.includes(val)
    })
  }, [allPoints, activeDimension, activeValues])

  const hasCoverage = !!props.coverageData && Object.keys(props.coverageData).length > 0

  const filterPanel = (
    <MapFilterPanel
      activeDimension={activeDimension}
      setActiveDimension={(d) => { setActiveDimension(d); setActiveValues([]) }}
      activeValues={activeValues}
      setActiveValues={setActiveValues}
      allPoints={allPoints}
      filteredCount={filteredPoints.length}
    />
  )

  // ── Modal (full-screen via portal) ──────────────────────────────────────────
  const modal = expanded && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black/60 backdrop-blur-sm">
      {/* Modal header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#dcdee6] shrink-0">
        <span className="text-sm font-semibold text-[#1b1f23]">Cobertura de territorios</span>
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1.5 text-xs text-[#6a737d] hover:text-[#1b1f23] border border-[#dcdee6] rounded-md px-2.5 py-1.5 hover:bg-[#f6f7f8] transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Cerrar
        </button>
      </div>

      {/* Filter panel */}
      {filterPanel}

      {/* Map */}
      <div className="flex-1 min-h-0 relative">
        <TerritoryMapDynamic
          {...props}
          height="100%"
          interactive
          contactPoints={filteredPoints}
          colorMode={colorMode}
          onPointClick={props.onPointClick}
        />
        <MapLegend colorMode={colorMode} hasCoverage={hasCoverage} />
      </div>
    </div>,
    document.body
  ) : null

  // ── Compact card view ────────────────────────────────────────────────────────
  return (
    <>
      <div className="overflow-hidden rounded-b-xl">
        {/* Filter panel */}
        {filterPanel}

        {/* Map + legend + expand button */}
        <div className="relative">
          <button
            onClick={() => setExpanded(true)}
            className="absolute top-2 right-2 z-[1000] flex items-center gap-1.5 bg-white border border-[#dcdee6] rounded-md px-2.5 py-1.5 shadow-sm hover:bg-[#f6f7f8] transition-colors text-xs text-[#6a737d] font-medium"
            title="Expandir mapa"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Expandir
          </button>
          <TerritoryMapDynamic
            {...props}
            height="320px"
            interactive
            contactPoints={filteredPoints}
            colorMode={colorMode}
            onPointClick={props.onPointClick}
          />
        </div>
      </div>

      {modal}
    </>
  )
}
