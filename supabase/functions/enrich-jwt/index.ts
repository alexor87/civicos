import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Edge Function: enrich-jwt
// Called as Supabase Custom Access Token hook.
// Must return the FULL claims object (original + custom).

Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const { user_id, claims: existingClaims } = payload

  if (!user_id) {
    return new Response(JSON.stringify({ error: 'Missing user_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role, campaign_ids')
    .eq('id', user_id)
    .single()

  // Merge custom claims into existing claims (Supabase requires full claims back)
  const claims = {
    ...existingClaims,
    tenant_id: profile?.tenant_id ?? null,
    role: profile?.role ?? null,
    campaign_ids: profile?.campaign_ids ?? [],
  }

  return new Response(JSON.stringify({ claims }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
