'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ColorMode, ContactPoint } from './MapFilterPanel'
import {
  STATUS_COLORS, STATUS_LABELS,
  VOTE_COLORS, VOTE_LABELS,
  PRIORITY_COLORS, PRIORITY_LABELS,
  ROLE_COLORS, ROLE_LABELS,
  SOURCE_COLORS, SOURCE_LABELS,
  RESULT_COLORS, RESULT_LABELS_PANEL,
} from './MapFilterPanel'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Territory {
  id: string
  name: string
  color: string
  status: string
  geojson: object | null
}

interface GeoUnit {
  id: string
  name: string
  type: string
  geojson: object
}

interface TerritoryMapProps {
  territories: Territory[]
  height?: string
  interactive?: boolean
  coverageData?: Record<string, number>
  visitData?: Record<string, { visits: number; estimated: number }>
  geoUnits?: GeoUnit[]
  contactPoints?: ContactPoint[]
  defaultCenter?: [number, number]
  defaultZoom?: number
  colorMode?: ColorMode
}

// ── Colombia defaults ──────────────────────────────────────────────────────────
const COLOMBIA_CENTER: [number, number] = [4.5709, -74.2973]
const COLOMBIA_ZOOM = 6

// ── Point coloring by mode ─────────────────────────────────────────────────────
function getPointColor(point: ContactPoint, mode: ColorMode = 'visit_result'): string {
  switch (mode) {
    case 'status':
      return STATUS_COLORS[point.status ?? ''] ?? '#94a3b8'
    case 'vote_intention':
      return VOTE_COLORS[point.vote_intention ?? ''] ?? '#94a3b8'
    case 'electoral_priority':
      return PRIORITY_COLORS[point.electoral_priority ?? ''] ?? '#94a3b8'
    case 'campaign_role':
      return ROLE_COLORS[point.campaign_role ?? ''] ?? '#94a3b8'
    case 'capture_source':
      return SOURCE_COLORS[point.capture_source ?? ''] ?? '#94a3b8'
    default: {
      const r = point.last_result
      if (!r) return '#94a3b8'
      return RESULT_COLORS[r] ?? '#94a3b8'
    }
  }
}

function getPointTooltip(point: ContactPoint, mode: ColorMode = 'visit_result'): string {
  switch (mode) {
    case 'status':
      return STATUS_LABELS[point.status ?? ''] ?? 'Sin datos'
    case 'vote_intention':
      return VOTE_LABELS[point.vote_intention ?? ''] ?? 'Sin datos'
    case 'electoral_priority':
      return PRIORITY_LABELS[point.electoral_priority ?? ''] ?? 'Sin datos'
    case 'campaign_role':
      return ROLE_LABELS[point.campaign_role ?? ''] ?? 'Sin datos'
    case 'capture_source':
      return SOURCE_LABELS[point.capture_source ?? ''] ?? 'Sin datos'
    default:
      return point.last_result ? (RESULT_LABELS_PANEL[point.last_result] ?? point.last_result) : 'Sin visita'
  }
}

// ── Coverage color scale (choropleth) ─────────────────────────────────────────
export function getCoverageColor(pct: number): string {
  if (pct >= 100) return '#22c55e'
  if (pct >= 67)  return '#84cc16'
  if (pct >= 34)  return '#eab308'
  if (pct >= 1)   return '#f97316'
  return '#ef4444'
}

// ── Coverage legend (static — only shown when choropleth active) ───────────────
const COVERAGE_LEGEND_HTML = `
  <div style="
    background: rgba(255,255,255,0.95);
    padding: 10px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-size: 11px;
    font-family: inherit;
    min-width: 130px;
  ">
    <p style="font-weight:700;color:#1b1f23;margin:0 0 6px">Cobertura</p>
    ${[
      ['#22c55e', '100% — Completo'],
      ['#84cc16', '67–99% — Alto'],
      ['#eab308', '34–66% — Medio'],
      ['#f97316', '1–33% — Bajo'],
      ['#ef4444', '0% — Sin visitas'],
    ].map(([color, label]) => `
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span style="width:12px;height:12px;border-radius:3px;background:${color};flex-shrink:0;display:inline-block"></span>
        <span style="color:#444">${label}</span>
      </div>`).join('')}
  </div>
`

// ── Component ──────────────────────────────────────────────────────────────────
export function TerritoryMap({
  territories,
  height = '500px',
  interactive = true,
  coverageData,
  visitData,
  geoUnits,
  contactPoints,
  defaultCenter,
  defaultZoom = 13,
  colorMode = 'visit_result',
}: TerritoryMapProps) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const leafletMapRef  = useRef<import('leaflet').Map | null>(null)
  const markersRef     = useRef<import('leaflet').LayerGroup | null>(null)
  const LRef           = useRef<typeof import('leaflet') | null>(null)
  const mapReadyRef    = useRef(false)
  const pendingMarkers = useRef<(() => void) | null>(null)
  const router         = useRouter()

  // ── Map initialization (once) ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    let map: import('leaflet').Map

    async function initMap() {
      const L = (await import('leaflet')).default
      LRef.current = L

      // Fix default icon path issue in Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      map = L.map(mapRef.current!, {
        center:          COLOMBIA_CENTER,
        zoom:            COLOMBIA_ZOOM,
        zoomControl:     true,
        scrollWheelZoom: interactive,
        dragging:        interactive,
      })

      leafletMapRef.current = map

      // OSM tile layer — free, no API key
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Geo units background layer
      if (geoUnits && geoUnits.length > 0) {
        for (const unit of geoUnits) {
          try {
            const geoLayer = L.geoJSON(unit.geojson as GeoJSON.GeoJsonObject, {
              style: {
                color: '#64748b', weight: 1, opacity: 0.6,
                fillColor: '#94a3b8', fillOpacity: 0.05, dashArray: '4 4',
              },
            })
            const typeLabel = unit.type === 'departamento' ? 'Depto.' : unit.type === 'municipio' ? 'Mun.' : 'Barrio'
            geoLayer.bindTooltip(`${unit.name} <span style="opacity:0.6">(${typeLabel})</span>`, {
              permanent: false, direction: 'center', className: 'territory-tooltip',
            })
            geoLayer.addTo(map)
          } catch { /* skip invalid geojson */ }
        }
      }

      const bounds: import('leaflet').LatLngBounds[] = []

      // Territory polygons
      for (const territory of territories) {
        if (!territory.geojson) continue
        const pct       = coverageData?.[territory.id] ?? -1
        const fillColor = coverageData
          ? (pct < 0 ? '#94a3b8' : getCoverageColor(pct))
          : (territory.color ?? '#1A6FE8')
        const baseOpacity = territory.status === 'archivado' ? 0.1 : 0.3

        const layer = L.geoJSON(territory.geojson as GeoJSON.GeoJsonObject, {
          style: {
            color:       coverageData ? '#ffffff' : fillColor,
            weight:      coverageData ? 1.5 : 2,
            opacity:     0.9,
            fillColor,
            fillOpacity: baseOpacity,
          },
        })

        const vd = visitData?.[territory.id]
        const tooltipContent = vd
          ? `<strong>${territory.name}</strong><br/>${vd.visits} / ${vd.estimated} visitas (${pct < 0 ? 0 : pct}%)`
          : territory.name

        layer.bindTooltip(tooltipContent, { permanent: false, direction: 'center', className: 'territory-tooltip' })

        if (interactive) {
          layer.on('click', () => { router.push(`/dashboard/canvassing/territories/${territory.id}`) })
          layer.on('mouseover', () => { layer.setStyle({ fillOpacity: 0.65, weight: 3 }) })
          layer.on('mouseout',  () => { layer.setStyle({ fillOpacity: baseOpacity, weight: coverageData ? 1.5 : 2 }) })
        }

        layer.addTo(map)
        try { bounds.push(layer.getBounds()) } catch { /* skip */ }
      }

      // Create markers LayerGroup (contact heat map — populated reactively)
      const markersLayer = L.layerGroup().addTo(map)
      markersRef.current = markersLayer

      // Fit: territory bounds → defaultCenter → Colombia
      if (bounds.length > 0) {
        const combined = bounds.reduce((acc, b) => acc.extend(b))
        map.fitBounds(combined, { padding: [30, 30], maxZoom: 15 })
      } else if (defaultCenter) {
        map.setView(defaultCenter, defaultZoom)
      }

      // Mark ready and run any pending marker update
      mapReadyRef.current = true
      if (pendingMarkers.current) {
        pendingMarkers.current()
        pendingMarkers.current = null
      }
    }

    initMap()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        markersRef.current = null
        LRef.current = null
        mapReadyRef.current = false
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Reactive marker updates ──────────────────────────────────────────────────
  useEffect(() => {
    const renderMarkers = () => {
      const L = LRef.current
      const layer = markersRef.current
      const map = leafletMapRef.current
      if (!L || !layer || !map) return

      layer.clearLayers()

      const points = contactPoints ?? []
      const ptBounds: import('leaflet').LatLngBounds[] = []

      for (const pt of points) {
        const color   = getPointColor(pt, colorMode)
        const tooltip = getPointTooltip(pt, colorMode)
        L.circleMarker([pt.lat, pt.lng], {
          radius:      6,
          fillColor:   color,
          color:       '#ffffff',
          weight:      1.5,
          opacity:     1,
          fillOpacity: 0.85,
        })
        .bindTooltip(tooltip, { permanent: false, direction: 'top', className: 'territory-tooltip' })
        .addTo(layer)
        try { ptBounds.push(L.latLngBounds([pt.lat, pt.lng], [pt.lat, pt.lng])) } catch { /* skip */ }
      }

      // Auto-fit to contact points only if there are no territories with bounds
      // (territories already fitted in initMap — don't re-fit on every filter change)
      if (ptBounds.length > 0 && territories.length === 0 && !defaultCenter) {
        const combined = ptBounds.reduce((acc, b) => acc.extend(b))
        map.fitBounds(combined, { padding: [30, 30], maxZoom: 15 })
      } else if (ptBounds.length === 0 && defaultCenter && territories.length === 0) {
        map.setView(defaultCenter, defaultZoom)
      }
    }

    if (mapReadyRef.current) {
      renderMarkers()
    } else {
      pendingMarkers.current = renderMarkers
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactPoints, colorMode])

  return (
    <>
      <style>{`
        .territory-tooltip {
          background: rgba(255,255,255,0.95);
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          white-space: nowrap;
        }
        .territory-tooltip::before { display: none; }
      `}</style>
      <div ref={mapRef} style={{ height, width: '100%', borderRadius: '8px' }} />
    </>
  )
}
