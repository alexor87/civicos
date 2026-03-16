import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('flow_templates')
      .select('*')
      .order('sort_order', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error('[GET /api/flows/templates]', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
