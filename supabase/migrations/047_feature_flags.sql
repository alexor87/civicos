-- 047_feature_flags.sql
-- Complete feature flags system: catalog, plan values, tenant overrides, resolution RPCs

-- ============================================================
-- 1. Platform features catalog
-- ============================================================

CREATE TABLE platform_features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL CHECK (type IN ('boolean', 'numeric', 'enum')),
  category    TEXT NOT NULL CHECK (category IN (
    'maps', 'ai', 'communications', 'operations', 'crm', 'limits'
  )),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_features_read" ON platform_features FOR SELECT USING (true);

-- Seed: 18 features
INSERT INTO platform_features (key, name, description, type, category, sort_order) VALUES
('google_maps_geocoding',    'Geocodificación Google Maps',     'Geocodifica direcciones con Google Maps API.',                'boolean', 'maps',           10),
('google_maps_monthly_limit','Límite mensual Google Maps',      'Máximo de requests mensuales. -1 = sin límite.',              'numeric', 'maps',           11),
('territory_map',            'Mapa de territorio',              'Vista de mapa con contactos y zonas de canvassing.',          'boolean', 'maps',           12),
('ai_byo_key',               'IA propia (BYO Key)',             'Permite conectar API key propia de proveedor de IA.',         'boolean', 'ai',             20),
('ai_providers',             'Proveedores de IA disponibles',   'Lista de proveedores que puede usar el tenant.',              'enum',    'ai',             21),
('active_agents',            'Agentes IA activos',              'Número máximo de agentes IA disponibles.',                    'numeric', 'ai',             22),
('agent_model_override',     'Modelo diferente por agente',     'Permite asignar modelos distintos a cada agente.',            'boolean', 'ai',             23),
('knowledge_base',           'Base de conocimiento',            'Módulo de documentos para contexto de los agentes.',          'boolean', 'ai',             24),
('operations_module',        'Módulo Operaciones',              'Gestión de tareas y misiones.',                               'boolean', 'operations',     30),
('calendar_intelligence',    'Inteligencia del calendario',     'Panel de preparación y score por evento.',                    'boolean', 'operations',     31),
('flows_module',             'Automatizaciones (Flows)',        'Editor visual de automatizaciones.',                          'boolean', 'operations',     32),
('contact_export_csv',       'Exportar contactos CSV',          'Descarga de la base de contactos.',                           'boolean', 'crm',            40),
('contact_import_csv',       'Importar contactos CSV',          'Carga masiva de contactos desde archivo.',                    'boolean', 'crm',            41),
('whatsapp_channel',         'Canal WhatsApp',                  'Envío de comunicaciones por WhatsApp vía Twilio.',            'boolean', 'communications', 50),
('contact_limit',            'Límite de contactos',             'Máximo de contactos. -1 = sin límite.',                       'numeric', 'limits',         60),
('team_member_limit',        'Límite de miembros del equipo',   'Máximo de perfiles en el tenant. -1 = sin límite.',           'numeric', 'limits',         61),
('custom_roles',             'Roles personalizados',            'Crear roles con permisos granulares personalizados.',         'boolean', 'limits',         62),
('demo_data',                'Campaña de práctica incluida',    'El tenant recibe datos demo al registrarse.',                 'boolean', 'crm',            70);

-- ============================================================
-- 2. Plan feature values
-- ============================================================

CREATE TABLE plan_features (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan        TEXT NOT NULL CHECK (plan IN ('esencial', 'pro', 'campaign', 'enterprise')),
  feature_key TEXT NOT NULL REFERENCES platform_features(key) ON DELETE CASCADE,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan, feature_key)
);

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_features_read" ON plan_features FOR SELECT USING (true);

-- Seed: Esencial
INSERT INTO plan_features (plan, feature_key, value) VALUES
('esencial', 'google_maps_geocoding',    'false'),
('esencial', 'google_maps_monthly_limit','0'),
('esencial', 'territory_map',            'true'),
('esencial', 'ai_byo_key',              'true'),
('esencial', 'ai_providers',            '["anthropic"]'),
('esencial', 'active_agents',           '2'),
('esencial', 'agent_model_override',    'false'),
('esencial', 'knowledge_base',          'false'),
('esencial', 'operations_module',       'true'),
('esencial', 'calendar_intelligence',   'false'),
('esencial', 'flows_module',            'false'),
('esencial', 'contact_export_csv',      'false'),
('esencial', 'contact_import_csv',      'true'),
('esencial', 'whatsapp_channel',        'false'),
('esencial', 'contact_limit',           '5000'),
('esencial', 'team_member_limit',       '5'),
('esencial', 'custom_roles',            'false'),
('esencial', 'demo_data',              'true');

-- Seed: Pro
INSERT INTO plan_features (plan, feature_key, value) VALUES
('pro', 'google_maps_geocoding',        'true'),
('pro', 'google_maps_monthly_limit',    '5000'),
('pro', 'territory_map',               'true'),
('pro', 'ai_byo_key',                  'true'),
('pro', 'ai_providers',               '["anthropic","openai","google"]'),
('pro', 'active_agents',               '4'),
('pro', 'agent_model_override',        'false'),
('pro', 'knowledge_base',              'true'),
('pro', 'operations_module',           'true'),
('pro', 'calendar_intelligence',       'true'),
('pro', 'flows_module',               'true'),
('pro', 'contact_export_csv',          'true'),
('pro', 'contact_import_csv',          'true'),
('pro', 'whatsapp_channel',            'false'),
('pro', 'contact_limit',               '25000'),
('pro', 'team_member_limit',           '15'),
('pro', 'custom_roles',               'true'),
('pro', 'demo_data',                  'true');

-- Seed: Campaign
INSERT INTO plan_features (plan, feature_key, value) VALUES
('campaign', 'google_maps_geocoding',   'true'),
('campaign', 'google_maps_monthly_limit','-1'),
('campaign', 'territory_map',           'true'),
('campaign', 'ai_byo_key',             'true'),
('campaign', 'ai_providers',           '["anthropic","openai","google","mistral","groq"]'),
('campaign', 'active_agents',           '6'),
('campaign', 'agent_model_override',   'true'),
('campaign', 'knowledge_base',         'true'),
('campaign', 'operations_module',      'true'),
('campaign', 'calendar_intelligence',  'true'),
('campaign', 'flows_module',           'true'),
('campaign', 'contact_export_csv',     'true'),
('campaign', 'contact_import_csv',     'true'),
('campaign', 'whatsapp_channel',       'true'),
('campaign', 'contact_limit',          '-1'),
('campaign', 'team_member_limit',      '-1'),
('campaign', 'custom_roles',           'true'),
('campaign', 'demo_data',             'true');

-- Seed: Enterprise (same as Campaign — customized via overrides)
INSERT INTO plan_features (plan, feature_key, value) VALUES
('enterprise', 'google_maps_geocoding',   'true'),
('enterprise', 'google_maps_monthly_limit','-1'),
('enterprise', 'territory_map',           'true'),
('enterprise', 'ai_byo_key',             'true'),
('enterprise', 'ai_providers',           '["anthropic","openai","google","mistral","groq"]'),
('enterprise', 'active_agents',           '-1'),
('enterprise', 'agent_model_override',   'true'),
('enterprise', 'knowledge_base',         'true'),
('enterprise', 'operations_module',      'true'),
('enterprise', 'calendar_intelligence',  'true'),
('enterprise', 'flows_module',           'true'),
('enterprise', 'contact_export_csv',     'true'),
('enterprise', 'contact_import_csv',     'true'),
('enterprise', 'whatsapp_channel',       'true'),
('enterprise', 'contact_limit',          '-1'),
('enterprise', 'team_member_limit',      '-1'),
('enterprise', 'custom_roles',           'true'),
('enterprise', 'demo_data',             'true');

-- ============================================================
-- 3. Tenant feature overrides
-- ============================================================

CREATE TABLE tenant_feature_overrides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key   TEXT NOT NULL REFERENCES platform_features(key) ON DELETE CASCADE,
  value         JSONB NOT NULL,
  reason        TEXT,
  set_by_admin  UUID REFERENCES admin_users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, feature_key)
);

ALTER TABLE tenant_feature_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_overrides_blocked" ON tenant_feature_overrides FOR ALL USING (false);

CREATE INDEX idx_tenant_overrides_tenant ON tenant_feature_overrides(tenant_id);

-- ============================================================
-- 4. RPC: resolve all features for a tenant
-- ============================================================

CREATE OR REPLACE FUNCTION resolve_all_tenant_features(
  p_tenant_id UUID,
  p_plan      TEXT
)
RETURNS TABLE(feature_key TEXT, resolved_value JSONB, source TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pf.key AS feature_key,
    COALESCE(tfo.value, pfv.value, 'false'::JSONB) AS resolved_value,
    CASE
      WHEN tfo.id IS NOT NULL THEN 'override'
      WHEN pfv.id IS NOT NULL THEN 'plan'
      ELSE 'default'
    END AS source
  FROM platform_features pf
  LEFT JOIN plan_features pfv
    ON pfv.feature_key = pf.key AND pfv.plan = p_plan
  LEFT JOIN tenant_feature_overrides tfo
    ON tfo.tenant_id = p_tenant_id AND tfo.feature_key = pf.key
  WHERE pf.is_active = true
  ORDER BY pf.sort_order;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION resolve_all_tenant_features(UUID, TEXT) TO authenticated, service_role;

-- RPC: resolve a single feature
CREATE OR REPLACE FUNCTION resolve_tenant_feature(
  p_tenant_id   UUID,
  p_feature_key TEXT
)
RETURNS TABLE(feature_key TEXT, resolved_value JSONB, source TEXT) AS $$
DECLARE v_plan TEXT;
BEGIN
  SELECT plan INTO v_plan FROM tenants WHERE id = p_tenant_id;

  RETURN QUERY
  SELECT
    p_feature_key,
    COALESCE(
      (SELECT value FROM tenant_feature_overrides
       WHERE tenant_id = p_tenant_id AND feature_key = p_feature_key),
      (SELECT value FROM plan_features
       WHERE plan = v_plan AND feature_key = p_feature_key),
      'false'::JSONB
    ),
    CASE
      WHEN EXISTS(SELECT 1 FROM tenant_feature_overrides
                  WHERE tenant_id = p_tenant_id AND feature_key = p_feature_key)
        THEN 'override'::TEXT
      ELSE 'plan'::TEXT
    END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION resolve_tenant_feature(UUID, TEXT) TO authenticated, service_role;
