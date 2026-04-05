-- ============================================================
-- 050_fix_onboarding_rls.sql — Fix onboarding_state RLS policy
-- ============================================================
-- The original policy used JWT claims (tenant_id) which Supabase
-- doesn't include by default. Replace with auth.uid() + profiles join.

DROP POLICY IF EXISTS "Tenant members can read own onboarding state" ON onboarding_state;

CREATE POLICY "Tenant members can read own onboarding state"
  ON onboarding_state FOR SELECT
  USING (tenant_id IN (
    SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
  ));
