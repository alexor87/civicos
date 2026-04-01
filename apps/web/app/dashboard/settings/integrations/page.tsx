import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IntegrationsForm } from '@/components/settings/IntegrationsForm'
import { getIntegrationConfig } from '@/lib/get-integration-config'

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, campaign_ids, role')
    .eq('id', user.id)
    .single()

  const canEdit = ['super_admin', 'campaign_manager'].includes(profile?.role ?? '')
  const tenantId = profile?.tenant_id
  const campaignId = profile?.campaign_ids?.[0] ?? null

  const config = tenantId
    ? await getIntegrationConfig(supabase, tenantId, campaignId)
    : null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-[#1b1f23]">Integraciones</h2>
        <p className="text-sm text-[#6a737d] mt-0.5">
          Configura las claves de API para email, SMS y el modelo de IA.
        </p>
      </div>

      {canEdit ? (
        <IntegrationsForm
          integrationConfig={config}
          campaignId={campaignId}
        />
      ) : (
        <p className="text-sm text-[#6a737d]">Solo el Campaign Manager puede editar las integraciones.</p>
      )}
    </div>
  )
}
