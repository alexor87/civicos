import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { callAI, type AiProvider } from '../_shared/ai-router.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ valid: false, error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ valid: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { provider, model, apiKey } = await req.json() as {
      provider: AiProvider
      model: string
      apiKey: string
    }

    if (!provider || !model || !apiKey) {
      return new Response(JSON.stringify({ valid: false, error: 'Missing provider, model, or apiKey' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Call AI with override config (doesn't read DB)
    await callAI(
      supabase,
      'verify', // dummy tenant ID, not used with override
      'verify', // dummy campaign ID, not used with override
      [{ role: 'user', content: 'Say OK' }],
      { maxTokens: 10 },
      { provider, model, apiKey },
    )

    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ valid: false, error: message }), {
      status: 200, // Return 200 so client can read the error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
