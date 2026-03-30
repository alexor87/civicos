import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET — Return current AI config (without the actual key)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const campaignId = profile.campaign_ids?.[0]
  const adminSupabase = createAdminClient()

  // Get campaign-specific config or tenant default
  const { data: configs } = await adminSupabase
    .from('tenant_ai_config')
    .select('id, provider, model, api_key_hint, is_valid, campaign_id, updated_at')
    .eq('tenant_id', profile.tenant_id)
    .or(campaignId ? `campaign_id.eq.${campaignId},campaign_id.is.null` : 'campaign_id.is.null')
    .order('campaign_id', { ascending: false, nullsFirst: false })
    .limit(2)

  const config = configs?.find((c: any) => c.campaign_id === campaignId)
    ?? configs?.find((c: any) => c.campaign_id === null)

  if (!config) {
    return NextResponse.json({ configured: false })
  }

  return NextResponse.json({
    configured: true,
    id: config.id,
    provider: config.provider,
    model: config.model,
    api_key_hint: config.api_key_hint,
    is_valid: config.is_valid,
    campaign_id: config.campaign_id,
    updated_at: config.updated_at,
  })
}

// POST — Verify key and save config
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Only admins
  if (!['super_admin', 'campaign_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { provider, model, apiKey, campaignId } = body as {
    provider: string
    model: string
    apiKey: string
    campaignId?: string | null
  }

  if (!provider || !model || !apiKey) {
    return NextResponse.json({ error: 'Missing provider, model, or apiKey' }, { status: 400 })
  }

  const targetCampaignId = campaignId ?? profile.campaign_ids?.[0] ?? null

  // Validate that campaignId belongs to the user's campaigns
  if (targetCampaignId && !profile.campaign_ids?.includes(targetCampaignId)) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 403 })
  }

  // Verify the key works by calling verify-ai-key Edge Function
  let isValid = false
  let verifyError: string | null = null
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const verifyRes = await fetch(`${supabaseUrl}/functions/v1/verify-ai-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({ provider, model, apiKey }),
    })

    const verifyData = await verifyRes.json()
    isValid = verifyData.valid === true
    if (!isValid) verifyError = verifyData.error ?? 'Verification failed'
  } catch {
    verifyError = 'Could not reach verification service'
  }

  // Build hint from last 4 chars
  const hint = apiKey.length > 4
    ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    : '****'

  // Encrypt and upsert
  const adminSupabase = createAdminClient()

  // Encrypt the key via DB function
  const { data: encrypted } = await adminSupabase.rpc('encrypt_ai_key', { raw: apiKey })
  if (!encrypted) {
    return NextResponse.json({ error: 'Encryption failed' }, { status: 500 })
  }

  // Check if config exists for this tenant+campaign combo
  let query = adminSupabase
    .from('tenant_ai_config')
    .select('id')
    .eq('tenant_id', profile.tenant_id)

  if (targetCampaignId) {
    query = query.eq('campaign_id', targetCampaignId)
  } else {
    query = query.is('campaign_id', null)
  }

  const { data: existing } = await query.single()

  if (existing) {
    // Update
    await adminSupabase
      .from('tenant_ai_config')
      .update({
        provider,
        model,
        api_key_encrypted: encrypted,
        api_key_hint: hint,
        is_valid: isValid,
      })
      .eq('id', existing.id)
  } else {
    // Insert
    await adminSupabase
      .from('tenant_ai_config')
      .insert({
        tenant_id: profile.tenant_id,
        campaign_id: targetCampaignId,
        provider,
        model,
        api_key_encrypted: encrypted,
        api_key_hint: hint,
        is_valid: isValid,
      })
  }

  return NextResponse.json({
    success: true,
    is_valid: isValid,
    error: isValid ? null : verifyError,
  })
}

// DELETE — Remove AI config
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  if (!['super_admin', 'campaign_manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const configId = searchParams.get('id')

  if (!configId) {
    return NextResponse.json({ error: 'Missing config id' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()
  await adminSupabase
    .from('tenant_ai_config')
    .delete()
    .eq('id', configId)
    .eq('tenant_id', profile.tenant_id)

  return NextResponse.json({ success: true })
}
