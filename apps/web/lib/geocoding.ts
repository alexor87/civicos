/**
 * Shared geocoding utility using Google Maps Geocoding API.
 */

interface GeocodeResult {
  lat: number
  lng: number
  locationType: string
  displayName: string
}

export async function geocodeAddress(
  address: string,
  municipality?: string,
  department?: string,
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_GEOCODING_KEY
  if (!apiKey) return null

  const query = [address, municipality, department, 'Colombia']
    .filter(Boolean)
    .join(', ')

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('region', 'co')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.length) return null

  const result = data.results[0]
  const { lat, lng } = result.geometry.location
  const locationType: string = result.geometry.location_type

  // APPROXIMATE = only found the municipality, not the street
  if (locationType === 'APPROXIMATE') return null

  return { lat, lng, locationType, displayName: result.formatted_address }
}
