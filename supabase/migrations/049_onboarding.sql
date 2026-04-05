-- ============================================================
-- 049_onboarding.sql — Onboarding Wow: infraestructura
-- ============================================================

-- 1. Flag de campaña demo
ALTER TABLE campaigns ADD COLUMN is_demo BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_campaigns_demo ON campaigns(tenant_id, is_demo);

-- 2. Estado del onboarding
CREATE TABLE onboarding_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stage           TEXT NOT NULL DEFAULT 'pending'
                  CHECK (stage IN ('pending','seeding','demo','activating','active')),

  -- Wizard de activación (datos parciales)
  wizard_data     JSONB NOT NULL DEFAULT '{}',
  wizard_started_at TIMESTAMPTZ,

  -- Tracking de emails
  last_email_sent TEXT,
  last_email_at   TIMESTAMPTZ,

  -- Timestamps
  demo_started_at   TIMESTAMPTZ,
  activated_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_onboarding_tenant UNIQUE (tenant_id)
);

-- RLS
ALTER TABLE onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can read own onboarding state"
  ON onboarding_state FOR SELECT
  USING (tenant_id = (current_setting('request.jwt.claims', true)::json ->> 'tenant_id')::uuid);

CREATE POLICY "Service role full access on onboarding_state"
  ON onboarding_state FOR ALL
  USING (current_setting('role', true) = 'service_role');

-- 3. RPC: activar campaña real (borra demo, crea real)
CREATE OR REPLACE FUNCTION activate_real_campaign(
  p_tenant_id    UUID,
  p_name         TEXT,
  p_candidate    TEXT DEFAULT NULL,
  p_election_type TEXT DEFAULT NULL,
  p_election_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_demo_campaign_id UUID;
  v_new_campaign_id  UUID;
BEGIN
  -- Buscar campaña demo
  SELECT id INTO v_demo_campaign_id
    FROM campaigns
   WHERE tenant_id = p_tenant_id AND is_demo = true
   LIMIT 1;

  -- Borrar datos demo (cascade eliminará contacts, visits, territories, events, suggestions)
  IF v_demo_campaign_id IS NOT NULL THEN
    DELETE FROM campaigns WHERE id = v_demo_campaign_id;
  END IF;

  -- Crear campaña real
  INSERT INTO campaigns (tenant_id, name, candidate_name, election_date, config, is_demo)
  VALUES (
    p_tenant_id,
    p_name,
    p_candidate,
    p_election_date,
    jsonb_build_object('election_type', COALESCE(p_election_type, 'municipal')),
    false
  )
  RETURNING id INTO v_new_campaign_id;

  -- Actualizar perfiles para apuntar a la nueva campaña
  UPDATE profiles
     SET campaign_ids = ARRAY[v_new_campaign_id]
   WHERE tenant_id = p_tenant_id;

  -- Marcar onboarding como activo
  UPDATE onboarding_state
     SET stage = 'active',
         activated_at = now(),
         updated_at = now()
   WHERE tenant_id = p_tenant_id;

  RETURN v_new_campaign_id;
END;
$$;

-- 4. Vista para cola de emails de seguimiento
CREATE OR REPLACE VIEW onboarding_followup_queue AS
SELECT
  os.tenant_id,
  t.name AS tenant_name,
  os.stage,
  os.demo_started_at,
  os.last_email_sent,
  os.last_email_at,
  EXTRACT(DAY FROM now() - os.demo_started_at)::int AS days_in_demo,
  p.id AS user_id,
  -- Obtener email del auth user via profiles
  p.full_name
FROM onboarding_state os
JOIN tenants t ON t.id = os.tenant_id
JOIN profiles p ON p.tenant_id = os.tenant_id AND p.role = 'super_admin'
WHERE os.stage = 'demo'
  AND os.demo_started_at IS NOT NULL
  AND (
    -- Día 1: sin email enviado aún
    (os.last_email_sent IS NULL AND now() - os.demo_started_at >= interval '1 day')
    -- Día 3
    OR (os.last_email_sent = 'day1' AND now() - os.demo_started_at >= interval '3 days')
    -- Día 6
    OR (os.last_email_sent = 'day3' AND now() - os.demo_started_at >= interval '6 days')
    -- Día 8
    OR (os.last_email_sent = 'day6' AND now() - os.demo_started_at >= interval '8 days')
  );
