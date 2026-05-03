import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveCampaignContext } from '@/lib/auth/active-campaign-context'
import { IntegrationsForm } from '@/components/settings/IntegrationsForm'
import { getIntegrationConfig } from '@/lib/get-integration-config'

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { activeTenantId, activeCampaignId, role } = await getActiveCampaignContext(supabase, user.id)
  const canEdit = ['super_admin', 'campaign_manager'].includes(role ?? '')
  const tenantId = activeTenantId
  const campaignId = activeCampaignId || null

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
          tenantId={tenantId ?? null}
        />
      ) : (
        <p className="text-sm text-[#6a737d]">Solo el Campaign Manager puede editar las integraciones.</p>
      )}
    </div>
  )
}
