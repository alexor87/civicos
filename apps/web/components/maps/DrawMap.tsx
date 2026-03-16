'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

interface DrawMapProps {
  height?: string
  color?: string
  initialGeoJson?: object | null
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const COLOMBIA_CENTER: [number, number] = [4.5709, -74.2973]

export function DrawMap({ height = '400px', color = '#1A6FE8', initialGeoJson }: DrawMapProps) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLInputElement>(null)
  const mapInited      = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)

  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)

  async function searchLocation(q: string) {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=co`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchLocation(query)
    }
  }

  function selectResult(r: NominatimResult) {
    setResults([])
    setQuery(r.display_name.split(',').slice(0, 2).join(','))
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([parseFloat(r.lat), parseFloat(r.lon)], 14)
    }
  }

  useEffect(() => {
    if (!mapRef.current || mapInited.current) return
    mapInited.current = true

    async function initMap() {
      const L = (await import('leaflet')).default
      await import('leaflet-draw')

      // Fix default icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: COLOMBIA_CENTER,
        zoom: 12,
      })
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      const drawnItems = new L.FeatureGroup()
      map.addLayer(drawnItems)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const drawControl = new (L as any).Control.Draw({
        edit: { featureGroup: drawnItems, remove: true },
        draw: {
          polygon:      { shapeOptions: { color, fillColor: color } },
          polyline:     false,
          rectangle:    false,
          circle:       false,
          marker:       false,
          circlemarker: false,
        },
      })
      map.addControl(drawControl)

      const updateInput = () => {
        if (!inputRef.current) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geojson = drawnItems.toGeoJSON() as any
        inputRef.current.value = geojson.features.length > 0
          ? JSON.stringify(geojson)
          : ''
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on((L as any).Draw.Event.CREATED, (e: any) => {
        drawnItems.clearLayers()
        drawnItems.addLayer(e.layer)
        updateInput()
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on((L as any).Draw.Event.DELETED, () => updateInput())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on((L as any).Draw.Event.EDITED,  () => updateInput())

      // Pre-load initial geojson (from geo_unit selection)
      if (initialGeoJson) {
        try {
          const layer = L.geoJSON(initialGeoJson as GeoJSON.GeoJsonObject)
          layer.eachLayer(l => drawnItems.addLayer(l))
          updateInput()
          try { map.fitBounds(layer.getBounds(), { padding: [20, 20] }) } catch { /* no bounds */ }
        } catch { /* invalid geojson */ }
      }
    }

    initMap()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-1.5">
      {/* Location search */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar barrio, ciudad… (Enter para buscar)"
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          />
          {searching && <span className="text-xs text-muted-foreground">Buscando…</span>}
        </div>
        {results.length > 0 && (
          <ul className="absolute z-[9999] mt-1 w-full rounded-md border border-input bg-white shadow-lg text-sm overflow-hidden">
            {results.map(r => (
              <li
                key={r.place_id}
                onClick={() => selectResult(r)}
                className="px-3 py-2 hover:bg-slate-50 cursor-pointer truncate text-slate-700"
              >
                {r.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ height, width: '100%', borderRadius: '8px' }} />
      <input ref={inputRef} type="hidden" name="geojson" />
      <p className="text-xs text-muted-foreground">
        Usa la herramienta de polígono para delimitar el territorio en el mapa. Puedes editar o eliminar el polígono después de dibujarlo.
      </p>
    </div>
  )
}
