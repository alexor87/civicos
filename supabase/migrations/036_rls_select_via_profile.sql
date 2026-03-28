-- 036_rls_select_via_profile.sql
-- Fix: RLS SELECT policies that resolve tenant via profiles + auth.uid()
-- instead of depending on JWT claims (auth_tenant_id()).
--
-- These are ADDITIVE — existing policies still work if JWT has tenant_id.
-- These new policies work even when JWT has NO custom claims.

-- ══════════════════════════════════════════════════════════════
-- custom_roles: read roles in user's tenant
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "custom_roles_select_via_profile" ON custom_roles
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- ══════════════════════════════════════════════════════════════
-- role_permissions: read permissions in user's tenant
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "role_permissions_select_via_profile" ON role_permissions
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- NOTE: profiles_select_same_tenant was removed — it caused infinite recursion
-- (42P17) because it subqueried profiles inside a profiles RLS policy.
-- Same-tenant profile reads are handled by profiles_select (tenant_id = auth_tenant_id()).
