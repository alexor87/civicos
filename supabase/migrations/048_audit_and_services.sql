-- 048_audit_and_services.sql
-- Immutable audit log for admin actions + global third-party service keys

-- ============================================================
-- 1. Admin audit log (immutable)
-- ============================================================

CREATE TABLE admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      UUID REFERENCES admin_users(id),
  admin_email   TEXT NOT NULL,
  action        TEXT NOT NULL,
  tenant_id     UUID REFERENCES tenants(id) ON DELETE SET NULL,
  tenant_name   TEXT,
  payload       JSONB NOT NULL DEFAULT '{}',
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  -- NO updated_at — this log is immutable
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- INSERT only — no UPDATE or DELETE for anyone
CREATE POLICY "audit_log_insert_only"
  ON admin_audit_log FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_log_no_update"
  ON admin_audit_log FOR UPDATE USING (false);
CREATE POLICY "audit_log_no_delete"
  ON admin_audit_log FOR DELETE USING (false);
CREATE POLICY "audit_log_no_read"
  ON admin_audit_log FOR SELECT USING (false);

-- Indexes for efficient querying
CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_email, created_at DESC);
CREATE INDEX idx_audit_log_tenant ON admin_audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action, created_at DESC);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at DESC);

-- ============================================================
-- 2. Global service keys (managed by Scrutix)
-- ============================================================

CREATE TABLE global_service_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service         TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  api_key_enc     TEXT,
  api_key_hint    TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  monthly_limit   INTEGER,
  usage_this_month INTEGER NOT NULL DEFAULT 0,
  usage_reset_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE global_service_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "global_keys_blocked" ON global_service_keys FOR ALL USING (false);

-- Seed: Google Maps Geocoding
INSERT INTO global_service_keys (service, name, monthly_limit)
VALUES ('google_maps_geocoding', 'Google Maps Geocoding API', 100000);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_global_keys_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_global_keys_updated_at
  BEFORE UPDATE ON global_service_keys
  FOR EACH ROW EXECUTE FUNCTION update_global_keys_updated_at();
