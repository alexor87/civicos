import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const documentNumber = searchParams.get('document_number')
  const campaignId = searchParams.get('campaign_id')
  const excludeId = searchParams.get('exclude_id')

  if (!documentNumber || !campaignId) {
    return NextResponse.json(
      { error: 'document_number and campaign_id are required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .eq('campaign_id', campaignId)
    .eq('document_number', documentNumber)
    .limit(1)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data: existing } = await query.single()

  if (existing) {
    return NextResponse.json({ duplicate: true, contact: existing })
  }

  return NextResponse.json({ duplicate: false })
}
