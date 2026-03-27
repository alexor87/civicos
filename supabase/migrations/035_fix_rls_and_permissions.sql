-- 035_fix_rls_and_permissions.sql
-- Fix: RLS blocks profile reads in API routes → roles page shows 403
--
-- Root cause: JWT has 'user_role' instead of 'role', auth_role() returns NULL,
-- and there's no self-read policy on profiles.

-- ══════════════════════════════════════════════════════════════
-- 1. Allow users to always read their own profile
-- ══════════════════════════════════════════════════════════════
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

-- ══════════════════════════════════════════════════════════════
-- 2. Fix auth_role() to read both 'role' and 'user_role' claims
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT COALESCE(auth.jwt() ->> 'role', auth.jwt() ->> 'user_role');
$$ LANGUAGE SQL STABLE;

-- ══════════════════════════════════════════════════════════════
-- 3. SECURITY DEFINER RPC for permission checks (bypasses RLS)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION check_user_permission(p_user_id UUID, p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role       TEXT;
  v_role_id    UUID;
  v_tenant_id  UUID;
  v_is_active  BOOLEAN;
BEGIN
  -- Read profile directly (no RLS)
  SELECT role::TEXT, custom_role_id, tenant_id
    INTO v_role, v_role_id, v_tenant_id
    FROM profiles
   WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Super admin has all permissions
  IF v_role = 'super_admin' THEN RETURN TRUE; END IF;

  -- Resolve custom_role_id if not set
  IF v_role_id IS NULL THEN
    SELECT id INTO v_role_id
      FROM custom_roles
     WHERE tenant_id = v_tenant_id
       AND base_role_key = v_role
       AND is_system = true;
  END IF;

  IF v_role_id IS NULL THEN RETURN FALSE; END IF;

  -- Check specific permission
  SELECT is_active INTO v_is_active
    FROM role_permissions
   WHERE role_id = v_role_id
     AND permission = p_permission;

  RETURN COALESCE(v_is_active, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
