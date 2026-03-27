-- 034_custom_roles.sql
-- Dynamic RBAC: custom_roles + role_permissions tables
-- Backward-compatible: existing user_role ENUM and RLS policies stay untouched

-- ══════════════════════════════════════════════════════════════
-- Table: custom_roles
-- ══════════════════════════════════════════════════════════════
CREATE TABLE custom_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  color         TEXT NOT NULL DEFAULT '#6366F1',
  is_system     BOOLEAN NOT NULL DEFAULT false,
  base_role_key TEXT,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_custom_roles_tenant ON custom_roles(tenant_id);

CREATE TRIGGER trg_custom_roles_updated_at
  BEFORE UPDATE ON custom_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_roles_select" ON custom_roles
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY "custom_roles_insert" ON custom_roles
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'super_admin'
  );

CREATE POLICY "custom_roles_update" ON custom_roles
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'super_admin'
  );

CREATE POLICY "custom_roles_delete" ON custom_roles
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'super_admin'
    AND is_system = false
  );

-- ══════════════════════════════════════════════════════════════
-- Table: role_permissions
-- ══════════════════════════════════════════════════════════════
CREATE TABLE role_permissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role_id       UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  permission    TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, role_id, permission)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_tenant ON role_permissions(tenant_id);

CREATE TRIGGER trg_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_select" ON role_permissions
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY "role_permissions_insert" ON role_permissions
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'super_admin'
  );

CREATE POLICY "role_permissions_update" ON role_permissions
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'super_admin'
  );

-- ══════════════════════════════════════════════════════════════
-- New column on profiles
-- ══════════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_custom_role ON profiles(custom_role_id);

-- ══════════════════════════════════════════════════════════════
-- Function: initialize_system_roles
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION initialize_system_roles(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO custom_roles (tenant_id, name, slug, description, color, is_system, base_role_key)
  VALUES
    (p_tenant_id, 'Super Admin',       'super-admin',       'Acceso total a la plataforma',      '#1E40AF', true, 'super_admin'),
    (p_tenant_id, 'Campaign Manager',  'campaign-manager',  'Gestión completa de la campaña',    '#7C3AED', true, 'campaign_manager'),
    (p_tenant_id, 'Field Coordinator', 'field-coordinator', 'Coordinación de terreno y equipos', '#059669', true, 'field_coordinator'),
    (p_tenant_id, 'Voluntario',        'voluntario',        'Canvassing y registro de visitas',  '#D97706', true, 'volunteer'),
    (p_tenant_id, 'Analista',          'analista',          'Reportes y análisis de datos',      '#DC2626', true, 'analyst')
  ON CONFLICT (tenant_id, slug) DO NOTHING;

  PERFORM initialize_default_permissions(p_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- Function: initialize_default_permissions
-- 47 permissions × 5 roles = 235 rows per tenant
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION initialize_default_permissions(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_sa UUID; v_cm UUID; v_fc UUID; v_vol UUID; v_an UUID;
BEGIN
  SELECT id INTO v_sa  FROM custom_roles WHERE tenant_id = p_tenant_id AND base_role_key = 'super_admin';
  SELECT id INTO v_cm  FROM custom_roles WHERE tenant_id = p_tenant_id AND base_role_key = 'campaign_manager';
  SELECT id INTO v_fc  FROM custom_roles WHERE tenant_id = p_tenant_id AND base_role_key = 'field_coordinator';
  SELECT id INTO v_vol FROM custom_roles WHERE tenant_id = p_tenant_id AND base_role_key = 'volunteer';
  SELECT id INTO v_an  FROM custom_roles WHERE tenant_id = p_tenant_id AND base_role_key = 'analyst';

  INSERT INTO role_permissions (tenant_id, role_id, permission, is_active)
  SELECT p_tenant_id, r.role_id, r.permission, r.is_active
  FROM (VALUES
    -- ── Contactos ──────────────────────────────────────────────
    (v_sa,'contacts.view',true),(v_cm,'contacts.view',true),(v_fc,'contacts.view',true),(v_vol,'contacts.view',true),(v_an,'contacts.view',true),
    (v_sa,'contacts.create',true),(v_cm,'contacts.create',true),(v_fc,'contacts.create',true),(v_vol,'contacts.create',true),(v_an,'contacts.create',false),
    (v_sa,'contacts.edit',true),(v_cm,'contacts.edit',true),(v_fc,'contacts.edit',true),(v_vol,'contacts.edit',false),(v_an,'contacts.edit',false),
    (v_sa,'contacts.delete',true),(v_cm,'contacts.delete',true),(v_fc,'contacts.delete',false),(v_vol,'contacts.delete',false),(v_an,'contacts.delete',false),
    (v_sa,'contacts.export',true),(v_cm,'contacts.export',true),(v_fc,'contacts.export',false),(v_vol,'contacts.export',false),(v_an,'contacts.export',true),
    (v_sa,'contacts.import',true),(v_cm,'contacts.import',true),(v_fc,'contacts.import',false),(v_vol,'contacts.import',false),(v_an,'contacts.import',false),
    (v_sa,'contacts.view_political_profile',true),(v_cm,'contacts.view_political_profile',true),(v_fc,'contacts.view_political_profile',true),(v_vol,'contacts.view_political_profile',false),(v_an,'contacts.view_political_profile',true),
    (v_sa,'contacts.edit_political_profile',true),(v_cm,'contacts.edit_political_profile',true),(v_fc,'contacts.edit_political_profile',true),(v_vol,'contacts.edit_political_profile',false),(v_an,'contacts.edit_political_profile',false),
    (v_sa,'contacts.view_strategic_fields',true),(v_cm,'contacts.view_strategic_fields',true),(v_fc,'contacts.view_strategic_fields',false),(v_vol,'contacts.view_strategic_fields',false),(v_an,'contacts.view_strategic_fields',true),
    -- ── Territorio y Canvassing ────────────────────────────────
    (v_sa,'territory.view',true),(v_cm,'territory.view',true),(v_fc,'territory.view',true),(v_vol,'territory.view',true),(v_an,'territory.view',true),
    (v_sa,'territory.manage',true),(v_cm,'territory.manage',true),(v_fc,'territory.manage',true),(v_vol,'territory.manage',false),(v_an,'territory.manage',false),
    (v_sa,'canvassing.view',true),(v_cm,'canvassing.view',true),(v_fc,'canvassing.view',true),(v_vol,'canvassing.view',true),(v_an,'canvassing.view',true),
    (v_sa,'canvassing.register_visits',true),(v_cm,'canvassing.register_visits',true),(v_fc,'canvassing.register_visits',true),(v_vol,'canvassing.register_visits',true),(v_an,'canvassing.register_visits',false),
    (v_sa,'canvassing.approve_visits',true),(v_cm,'canvassing.approve_visits',true),(v_fc,'canvassing.approve_visits',true),(v_vol,'canvassing.approve_visits',false),(v_an,'canvassing.approve_visits',false),
    (v_sa,'canvassing.assign_zones',true),(v_cm,'canvassing.assign_zones',true),(v_fc,'canvassing.assign_zones',true),(v_vol,'canvassing.assign_zones',false),(v_an,'canvassing.assign_zones',false),
    -- ── Comunicaciones ─────────────────────────────────────────
    (v_sa,'communications.view',true),(v_cm,'communications.view',true),(v_fc,'communications.view',false),(v_vol,'communications.view',false),(v_an,'communications.view',true),
    (v_sa,'communications.create',true),(v_cm,'communications.create',true),(v_fc,'communications.create',false),(v_vol,'communications.create',false),(v_an,'communications.create',false),
    (v_sa,'communications.send',true),(v_cm,'communications.send',true),(v_fc,'communications.send',false),(v_vol,'communications.send',false),(v_an,'communications.send',false),
    (v_sa,'communications.view_metrics',true),(v_cm,'communications.view_metrics',true),(v_fc,'communications.view_metrics',false),(v_vol,'communications.view_metrics',false),(v_an,'communications.view_metrics',true),
    -- ── Automatizaciones ───────────────────────────────────────
    (v_sa,'flows.view',true),(v_cm,'flows.view',true),(v_fc,'flows.view',false),(v_vol,'flows.view',false),(v_an,'flows.view',false),
    (v_sa,'flows.create',true),(v_cm,'flows.create',true),(v_fc,'flows.create',false),(v_vol,'flows.create',false),(v_an,'flows.create',false),
    (v_sa,'flows.activate',true),(v_cm,'flows.activate',true),(v_fc,'flows.activate',false),(v_vol,'flows.activate',false),(v_an,'flows.activate',false),
    (v_sa,'flows.delete',true),(v_cm,'flows.delete',true),(v_fc,'flows.delete',false),(v_vol,'flows.delete',false),(v_an,'flows.delete',false),
    -- ── Reportes e Inteligencia ────────────────────────────────
    (v_sa,'reports.view',true),(v_cm,'reports.view',true),(v_fc,'reports.view',false),(v_vol,'reports.view',false),(v_an,'reports.view',true),
    (v_sa,'reports.export',true),(v_cm,'reports.export',true),(v_fc,'reports.export',false),(v_vol,'reports.export',false),(v_an,'reports.export',true),
    (v_sa,'ai_agents.view',true),(v_cm,'ai_agents.view',true),(v_fc,'ai_agents.view',false),(v_vol,'ai_agents.view',false),(v_an,'ai_agents.view',true),
    (v_sa,'ai_agents.interact',true),(v_cm,'ai_agents.interact',true),(v_fc,'ai_agents.interact',false),(v_vol,'ai_agents.interact',false),(v_an,'ai_agents.interact',true),
    (v_sa,'ai_agents.approve',true),(v_cm,'ai_agents.approve',true),(v_fc,'ai_agents.approve',false),(v_vol,'ai_agents.approve',false),(v_an,'ai_agents.approve',false),
    (v_sa,'knowledge_base.view',true),(v_cm,'knowledge_base.view',true),(v_fc,'knowledge_base.view',true),(v_vol,'knowledge_base.view',false),(v_an,'knowledge_base.view',true),
    (v_sa,'knowledge_base.manage',true),(v_cm,'knowledge_base.manage',true),(v_fc,'knowledge_base.manage',false),(v_vol,'knowledge_base.manage',false),(v_an,'knowledge_base.manage',false),
    (v_sa,'content_ia.view',true),(v_cm,'content_ia.view',true),(v_fc,'content_ia.view',false),(v_vol,'content_ia.view',false),(v_an,'content_ia.view',false),
    (v_sa,'content_ia.generate',true),(v_cm,'content_ia.generate',true),(v_fc,'content_ia.generate',false),(v_vol,'content_ia.generate',false),(v_an,'content_ia.generate',false),
    -- ── Equipo y Configuración ─────────────────────────────────
    (v_sa,'team.view',true),(v_cm,'team.view',true),(v_fc,'team.view',true),(v_vol,'team.view',false),(v_an,'team.view',false),
    (v_sa,'team.invite',true),(v_cm,'team.invite',true),(v_fc,'team.invite',false),(v_vol,'team.invite',false),(v_an,'team.invite',false),
    (v_sa,'team.manage_roles',true),(v_cm,'team.manage_roles',true),(v_fc,'team.manage_roles',false),(v_vol,'team.manage_roles',false),(v_an,'team.manage_roles',false),
    (v_sa,'team.deactivate',true),(v_cm,'team.deactivate',false),(v_fc,'team.deactivate',false),(v_vol,'team.deactivate',false),(v_an,'team.deactivate',false),
    (v_sa,'settings.campaign',true),(v_cm,'settings.campaign',true),(v_fc,'settings.campaign',false),(v_vol,'settings.campaign',false),(v_an,'settings.campaign',false),
    (v_sa,'settings.integrations',true),(v_cm,'settings.integrations',false),(v_fc,'settings.integrations',false),(v_vol,'settings.integrations',false),(v_an,'settings.integrations',false),
    (v_sa,'settings.brand',true),(v_cm,'settings.brand',true),(v_fc,'settings.brand',false),(v_vol,'settings.brand',false),(v_an,'settings.brand',false),
    (v_sa,'settings.geo',true),(v_cm,'settings.geo',false),(v_fc,'settings.geo',false),(v_vol,'settings.geo',false),(v_an,'settings.geo',false),
    (v_sa,'settings.api',true),(v_cm,'settings.api',false),(v_fc,'settings.api',false),(v_vol,'settings.api',false),(v_an,'settings.api',false),
    (v_sa,'roles.manage',true),(v_cm,'roles.manage',false),(v_fc,'roles.manage',false),(v_vol,'roles.manage',false),(v_an,'roles.manage',false),
    -- ── Calendario ─────────────────────────────────────────────
    (v_sa,'calendar.view',true),(v_cm,'calendar.view',true),(v_fc,'calendar.view',true),(v_vol,'calendar.view',true),(v_an,'calendar.view',true),
    (v_sa,'calendar.create_events',true),(v_cm,'calendar.create_events',true),(v_fc,'calendar.create_events',true),(v_vol,'calendar.create_events',false),(v_an,'calendar.create_events',false),
    (v_sa,'calendar.manage_events',true),(v_cm,'calendar.manage_events',true),(v_fc,'calendar.manage_events',false),(v_vol,'calendar.manage_events',false),(v_an,'calendar.manage_events',false),
    -- ── Voluntarios ────────────────────────────────────────────
    (v_sa,'volunteers.view',true),(v_cm,'volunteers.view',true),(v_fc,'volunteers.view',true),(v_vol,'volunteers.view',false),(v_an,'volunteers.view',true),
    (v_sa,'volunteers.manage',true),(v_cm,'volunteers.manage',true),(v_fc,'volunteers.manage',true),(v_vol,'volunteers.manage',false),(v_an,'volunteers.manage',false)
  ) AS r(role_id, permission, is_active)
  ON CONFLICT (tenant_id, role_id, permission) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- Function: save_role_permissions (frontend RPC)
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION save_role_permissions(
  p_role_id     UUID,
  p_permissions JSONB
)
RETURNS VOID AS $$
DECLARE
  v_tenant_id UUID;
  v_perm JSONB;
BEGIN
  SELECT tenant_id INTO v_tenant_id FROM custom_roles WHERE id = p_role_id;
  IF v_tenant_id != auth_tenant_id() THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;
  IF auth_role() != 'super_admin' THEN
    RAISE EXCEPTION 'Solo Super Admin puede modificar permisos';
  END IF;

  FOR v_perm IN SELECT * FROM jsonb_array_elements(p_permissions)
  LOOP
    INSERT INTO role_permissions (tenant_id, role_id, permission, is_active)
    VALUES (v_tenant_id, p_role_id, v_perm->>'permission', (v_perm->>'is_active')::BOOLEAN)
    ON CONFLICT (tenant_id, role_id, permission)
    DO UPDATE SET is_active = EXCLUDED.is_active, updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- Backfill existing tenants
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE v_tenant RECORD;
BEGIN
  FOR v_tenant IN SELECT id FROM tenants LOOP
    PERFORM initialize_system_roles(v_tenant.id);
  END LOOP;
END $$;

-- Link existing profiles to their system roles
UPDATE profiles p
SET custom_role_id = cr.id
FROM custom_roles cr
WHERE cr.tenant_id = p.tenant_id
  AND cr.is_system = true
  AND cr.base_role_key = p.role::TEXT
  AND p.custom_role_id IS NULL;
