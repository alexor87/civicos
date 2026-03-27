-- 037_get_tenant_roles_rpc.sql
-- Single SECURITY DEFINER RPC that handles everything the roles page needs:
-- 1. Auto-initializes system roles if none exist
-- 2. Returns all roles with member counts
-- Completely bypasses RLS — no JWT dependency.

CREATE OR REPLACE FUNCTION get_tenant_roles(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_count INT;
  v_roles JSONB;
BEGIN
  -- Check if roles exist for this tenant
  SELECT count(*) INTO v_count FROM custom_roles WHERE tenant_id = p_tenant_id;

  -- Auto-initialize system roles if empty
  IF v_count = 0 THEN
    PERFORM initialize_system_roles(p_tenant_id);
  END IF;

  -- Fetch all roles with member counts in a single query
  SELECT jsonb_agg(row_to_json(r) ORDER BY r.is_system DESC, r.name)
  INTO v_roles
  FROM (
    SELECT
      cr.id,
      cr.tenant_id,
      cr.name,
      cr.slug,
      cr.description,
      cr.color,
      cr.is_system,
      cr.base_role_key,
      cr.created_by,
      cr.created_at,
      cr.updated_at,
      COALESCE(mc.cnt, 0) AS member_count
    FROM custom_roles cr
    LEFT JOIN (
      SELECT custom_role_id, count(*) AS cnt
      FROM profiles
      WHERE tenant_id = p_tenant_id AND custom_role_id IS NOT NULL
      GROUP BY custom_role_id
    ) mc ON mc.custom_role_id = cr.id
    WHERE cr.tenant_id = p_tenant_id
  ) r;

  RETURN COALESCE(v_roles, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
