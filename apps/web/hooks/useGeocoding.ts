import { useState, useCallback, useMemo } from 'react'
import { useDebouncedCallback } from 'use-debounce'

export type GeocodingState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; lat: number; lng: number; locationType: string; displayName: string }
  | { status: 'approximate'; center: { lat: number; lng: number } }
  | { status: 'error'; message: string }

export type ManualPin = { lat: number; lng: number } | null

export function useGeocoding() {
  const [state, setState] = useState<GeocodingState>({ status: 'idle' })
  const [manualPin, setManualPin] = useState<ManualPin>(null)

  const geocode = useDebouncedCallback(
    async (address: string, municipality: string, department?: string) => {
      if (!address.trim() || !municipality.trim()) return

      setState({ status: 'loading' })

      try {
        const res = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, municipality, department }),
        })
        const data = await res.json()

        if (!res.ok) {
          setState({ status: 'error', message: 'Error al buscar la dirección' })
          return
        }

        if (data.found) {
          setState({
            status: 'success',
            lat: data.lat,
            lng: data.lng,
            locationType: data.locationType,
            displayName: data.displayName,
          })
          setManualPin(null)
        } else if (data.approximate) {
          setState({ status: 'approximate', center: data.center })
          setManualPin(null)
        } else {
          setState({ status: 'error', message: 'No encontramos esta dirección' })
        }
      } catch {
        setState({ status: 'error', message: 'Error de conexión al geocodificar' })
      }
    },
    800,
  )

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setManualPin({ lat, lng })
  }, [])

  const handlePinDrag = useCallback((lat: number, lng: number) => {
    setManualPin({ lat, lng })
  }, [])

  const finalCoords = useMemo(() => {
    if (manualPin) return { ...manualPin, source: 'manual_pin' as const }
    if (state.status === 'success') return { lat: state.lat, lng: state.lng, source: 'geocoded' as const }
    return null
  }, [manualPin, state])

  return { state, manualPin, geocode, handleMapClick, handlePinDrag, finalCoords }
}
