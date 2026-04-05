import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiKeysManager } from '@/components/settings/ApiKeysManager'
import { ApiEndpointsDocs } from '@/components/settings/ApiEndpointsDocs'

export default async function ApiSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canManage = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  const campaignId = profile?.campaign_ids?.[0]

  const { data: keys } = campaignId
    ? await supabase
        .from('api_keys')
        .select('id, name, key_prefix, scopes, created_at, last_used_at, revoked_at')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[#1b1f23]">API Pública</h2>
        <p className="text-sm text-[#6a737d] mt-0.5">
          Gestiona las API keys para integrar Scrutix con sistemas externos.
          Usa el header <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">Authorization: Bearer &lt;key&gt;</code> en tus peticiones.
        </p>
      </div>

      {/* Endpoints reference */}
      <ApiEndpointsDocs />

      {!canManage && (
        <p className="text-sm text-[#6a737d]">Solo el Campaign Manager puede gestionar las API keys.</p>
      )}

      <ApiKeysManager initialKeys={keys ?? []} canManage={canManage} />
    </div>
  )
}
