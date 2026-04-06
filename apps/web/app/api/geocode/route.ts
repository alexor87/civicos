import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeAddress } from '@/lib/geocoding'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { address, municipality, department } = await req.json()

  if (!address || !municipality) {
    return NextResponse.json({ error: 'address and municipality required' }, { status: 400 })
  }

  if (!process.env.GOOGLE_MAPS_GEOCODING_KEY) {
    return NextResponse.json({ error: 'Geocoding not configured' }, { status: 503 })
  }

  const result = await geocodeAddress(address, municipality, department)

  if (!result) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({
    found: true,
    lat: result.lat,
    lng: result.lng,
    locationType: result.locationType,
    displayName: result.displayName,
  })
}
