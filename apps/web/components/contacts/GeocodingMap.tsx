'use client'

import { useEffect, useRef } from 'react'
import type { Map, Marker } from 'leaflet'
import type { GeocodingState, ManualPin } from '@/hooks/useGeocoding'

interface Props {
  state: GeocodingState
  manualPin: ManualPin
  onMapClick: (lat: number, lng: number) => void
  onPinDrag: (lat: number, lng: number) => void
  center: { lat: number; lng: number }
}

export function GeocodingMap({ state, manualPin, onMapClick, onPinDrag, center }: Props) {
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const LRef = useRef<typeof import('leaflet') | null>(null)

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import('leaflet').then((L) => {
      LRef.current = L

      // Fix default icons for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(containerRef.current!, {
        center: [center.lat, center.lng],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)

      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // React to geocoding state changes
  useEffect(() => {
    const map = mapRef.current
    const L = LRef.current
    if (!map || !L) return

    // Clear existing marker
    if (markerRef.current) {
      markerRef.current.remove()
      markerRef.current = null
    }

    if (state.status === 'success') {
      map.setView([state.lat, state.lng], 16, { animate: true })
      const marker = L.marker([state.lat, state.lng], { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onPinDrag(pos.lat, pos.lng)
      })
      markerRef.current = marker
      map.getContainer().style.cursor = ''
    } else if (state.status === 'approximate') {
      map.setView([state.center.lat, state.center.lng], 14, { animate: true })
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.getContainer().style.cursor = ''
    }
  }, [state, onPinDrag])

  // Handle manual pin placement/drag
  useEffect(() => {
    const map = mapRef.current
    const L = LRef.current
    if (!map || !L || !manualPin) return

    if (!markerRef.current) {
      const marker = L.marker([manualPin.lat, manualPin.lng], { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onPinDrag(pos.lat, pos.lng)
      })
      markerRef.current = marker
    } else {
      markerRef.current.setLatLng([manualPin.lat, manualPin.lng])
    }

    map.getContainer().style.cursor = ''
    map.setView([manualPin.lat, manualPin.lng], 16, { animate: true })
  }, [manualPin, onPinDrag])

  return (
    <div
      ref={containerRef}
      className="border border-border rounded-lg overflow-hidden h-[200px] sm:h-[240px]"
    />
  )
}
