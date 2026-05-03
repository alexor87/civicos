import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ActiveCampaignContext {
  activeTenantId: string | null
  campaignIds:    string[]
  activeCampaignId: string
  role:           string | null
  customRoleId:   string | null
}

/**
 * Returns the user's currently active tenant + campaign context.
 *
 * In multi-tenant mode, `profile.campaign_ids` only reflects the user's HOME
 * tenant — it cannot be used as the source of truth for "what is the user
 * looking at right now". This helper reads:
 *   1. `profile.active_tenant_id` (the tenant the user has switched to).
 *   2. `tenant_users.campaign_ids` for that active tenant (the campaigns the
 *      user has access to in the current scope).
 *   3. `active_campaign_id` cookie if it points to a campaign in the active
 *      tenant; otherwise the first campaign of that tenant.
 *
 * Pages that scope queries by campaign_id should use this helper instead of
 * reading `profile.campaign_ids[0]` directly.
 */
export async function getActiveCampaignContext(
  supabase: SupabaseClient,
  userId: string
): Promise<ActiveCampaignContext> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, active_tenant_id')
    .eq('id', userId)
    .single<{ tenant_id: string; active_tenant_id: string | null }>()

  const activeTenantId = profile?.active_tenant_id ?? profile?.tenant_id ?? null

  let campaignIds: string[] = []
  let role: string | null = null
  let customRoleId: string | null = null

  if (activeTenantId) {
    const { data: membership } = await supabase
      .from('tenant_users')
      .select('campaign_ids, role, custom_role_id')
      .eq('user_id', userId)
      .eq('tenant_id', activeTenantId)
      .maybeSingle<{
        campaign_ids: string[] | null
        role: string | null
        custom_role_id: string | null
      }>()
    campaignIds  = membership?.campaign_ids ?? []
    role         = membership?.role ?? null
    customRoleId = membership?.custom_role_id ?? null
  }

  const cookieStore = await cookies()
  const cookieCampaignId = cookieStore.get('active_campaign_id')?.value
  const activeCampaignId = (cookieCampaignId && campaignIds.includes(cookieCampaignId))
    ? cookieCampaignId
    : (campaignIds[0] ?? '')

  return { activeTenantId, campaignIds, activeCampaignId, role, customRoleId }
}
