import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateApiKey } from '@/lib/validate-api-key'

type Params = { params: Promise<{ id: string }> }

// ── GET — Campaign public info ────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const auth = await validateApiKey(req, supabase)
  if ('error' in auth) return auth.error

  const { ctx } = auth

  // API key must belong to the requested campaign
  if (ctx.campaignId !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name, status, created_at')
    .eq('id', id)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ data: campaign })
}
