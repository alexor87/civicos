-- 075_multi_tenant_rls_campaign_stats.sql
-- Replace RLS policies that referenced profiles.campaign_ids (HOME-tenant only)
-- with their equivalents over tenant_users (any tenant the user is member of).
--
-- Background: tenant_users + profiles.active_tenant_id were introduced for
-- multi-tenant memberships, but two policies (campaign_stats, api_keys) still
-- gated reads via profiles.campaign_ids. For users whose HOME tenant has empty
-- campaign_ids, the policies blocked reads of campaigns from any other tenant
-- they belong to — surfaced as "0 contactos en la campaña" and 0-KPIs in the
-- dashboard despite the JWT being correctly scoped to the active tenant.

DROP POLICY IF EXISTS campaign_stats_select ON public.campaign_stats;
CREATE POLICY campaign_stats_select ON public.campaign_stats
  FOR SELECT USING (
    campaign_id IN (
      SELECT unnest(tu.campaign_ids)
      FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS api_keys_campaign_access ON public.api_keys;
CREATE POLICY api_keys_campaign_access ON public.api_keys
  FOR ALL USING (
    campaign_id IN (
      SELECT unnest(tu.campaign_ids)
      FROM public.tenant_users tu
      WHERE tu.user_id = auth.uid()
    )
  );
