import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { address, municipality, department } = await req.json()

  if (!address || !municipality) {
    return NextResponse.json({ error: 'address and municipality required' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_GEOCODING_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Geocoding not configured' }, { status: 503 })
  }

  const query = [address, municipality, department, 'Colombia']
    .filter(Boolean)
    .join(', ')

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('region', 'co')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.length) {
    return NextResponse.json({
      found: false,
      reason: data.status,
    })
  }

  const result = data.results[0]
  const { lat, lng } = result.geometry.location
  const locationType: string = result.geometry.location_type

  // APPROXIMATE = solo encontró el municipio, no la calle
  if (locationType === 'APPROXIMATE') {
    return NextResponse.json({
      found: false,
      approximate: true,
      center: { lat, lng },
      displayName: result.formatted_address,
    })
  }

  return NextResponse.json({
    found: true,
    lat,
    lng,
    locationType,
    displayName: result.formatted_address,
  })
}
