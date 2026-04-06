'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ExpandableMap } from '@/components/maps/ExpandableMap'
import { ContactMapSheet, type ContactMapData } from './ContactMapSheet'
import type { ContactPoint } from '@/components/maps/MapFilterPanel'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Territory {
  id: string
  name: string
  color: string
  status: string
  geojson: object | null
}

interface ClusteredPoint {
  cluster_id: string
  lat: number
  lng: number
  point_count: number
  contact_id: string | null
  dominant_status: string | null
  dominant_result: string | null
}

interface MapBounds {
  minLat: number
  minLng: number
  maxLat: number
  maxLng: number
}

interface Props {
  territories: Territory[]
  coverageData?: Record<string, number>
  visitData?: Record<string, { visits: number; estimated: number }>
  campaignId: string
  defaultCenter?: [number, number]
  defaultZoom?: number
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CanvassingMapWithPanel(props: Props) {
  const [selectedContact, setSelectedContact] = useState<ContactMapData | null>(null)
  const [loading, setLoading] = useState(false)
  const [contactPoints, setContactPoints] = useState<ContactPoint[]>([])
  const [isLoadingPoints, setIsLoadingPoints] = useState(false)
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Fetch clustered points from API based on viewport
  const fetchPoints = useCallback(async (bounds: MapBounds, zoom: number) => {
    // Cancel any pending request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoadingPoints(true)
    try {
      const params = new URLSearchParams({
        campaignId: props.campaignId,
        minLat: bounds.minLat.toString(),
        minLng: bounds.minLng.toString(),
        maxLat: bounds.maxLat.toString(),
        maxLng: bounds.maxLng.toString(),
        zoom: zoom.toString(),
      })

      const res = await fetch(`/api/canvassing/map-points?${params}`, {
        signal: controller.signal,
      })
      if (!res.ok) return

      const clusters: ClusteredPoint[] = await res.json()

      // Convert clusters to ContactPoint format for the existing map components
      const points: ContactPoint[] = clusters.map(c => ({
        id: c.contact_id ?? c.cluster_id,
        lat: c.lat,
        lng: c.lng,
        last_result: c.dominant_result,
        status: c.dominant_status,
        vote_intention: null,
        campaign_role: null,
        electoral_priority: null,
        capture_source: null,
        visit_id: null,
        // Cluster metadata
        point_count: c.point_count,
        is_cluster: c.point_count > 1,
      }))

      setContactPoints(points)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
    } finally {
      setIsLoadingPoints(false)
    }
  }, [props.campaignId])

  // Debounced bounds change handler (300ms)
  const handleBoundsChange = useCallback((bounds: MapBounds, zoom: number) => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    fetchTimerRef.current = setTimeout(() => {
      fetchPoints(bounds, zoom)
    }, 300)
  }, [fetchPoints])

  // Initial load with default bounds (approximate Colombia)
  useEffect(() => {
    const [lat, lng] = props.defaultCenter ?? [6.1543, -75.3744]
    const zoom = props.defaultZoom ?? 13
    // Approximate viewport bounds from center + zoom
    const latSpan = 180 / Math.pow(2, zoom)
    const lngSpan = 360 / Math.pow(2, zoom)
    fetchPoints({
      minLat: lat - latSpan,
      minLng: lng - lngSpan,
      maxLat: lat + latSpan,
      maxLng: lng + lngSpan,
    }, zoom)

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePointClick = useCallback(async (point: ContactPoint) => {
    // If it's a cluster, don't try to load details
    if ((point as ContactPoint & { is_cluster?: boolean }).is_cluster) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/canvassing/contacts/${point.id}?campaignId=${props.campaignId}`)
      if (!res.ok) {
        toast.error('No se pudo cargar la información del contacto')
        return
      }
      const data = await res.json() as ContactMapData
      setSelectedContact(data)
    } catch {
      toast.error('No se pudo cargar la información del contacto')
    } finally {
      setLoading(false)
    }
  }, [props.campaignId])

  return (
    <>
      <ExpandableMap
        territories={props.territories}
        coverageData={props.coverageData}
        visitData={props.visitData}
        contactPoints={contactPoints}
        defaultCenter={props.defaultCenter}
        defaultZoom={props.defaultZoom}
        onPointClick={handlePointClick}
        onBoundsChange={handleBoundsChange}
      />
      {(loading || isLoadingPoints) && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-white border border-[#dcdee6] rounded-md px-4 py-2 shadow-lg text-xs text-[#6a737d]">
          {isLoadingPoints ? 'Cargando puntos…' : 'Cargando perfil…'}
        </div>
      )}
      <ContactMapSheet
        data={selectedContact}
        onClose={() => setSelectedContact(null)}
      />
    </>
  )
}
