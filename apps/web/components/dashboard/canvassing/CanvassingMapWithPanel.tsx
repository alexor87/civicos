'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ExpandableMap } from '@/components/maps/ExpandableMap'
import { VisitDetailSheet, type VisitRow } from './VisitDetailSheet'
import type { ContactPoint } from '@/components/maps/MapFilterPanel'

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
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CanvassingMapWithPanel(props: Props) {
  const [selectedVisit, setSelectedVisit] = useState<VisitRow | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePointClick = useCallback(async (point: ContactPoint) => {
    if (!point.visit_id) {
      toast.info('Este contacto no tiene visitas registradas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/canvassing/visits/${point.visit_id}`)
      if (!res.ok) throw new Error('Not found')
      const visit = await res.json() as VisitRow
      setSelectedVisit(visit)
    } catch {
      toast.error('No se pudo cargar la información de la visita')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <>
      <ExpandableMap
        {...props}
        onPointClick={handlePointClick}
      />
      {loading && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-white border border-[#dcdee6] rounded-md px-4 py-2 shadow-lg text-xs text-[#6a737d]">
          Cargando perfil…
        </div>
      )}
      <VisitDetailSheet
        visit={selectedVisit}
        onClose={() => setSelectedVisit(null)}
        canApprove={false}
      />
    </>
  )
}
