-- 046_admin_and_tenants.sql
-- Admin users table + tenant extensions for backoffice management

-- ============================================================
-- 1. Admin users (Scrutix platform operators)
--    Completely separate from tenant profiles
-- ============================================================

CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only accessible via service_role — never by regular users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_users_blocked" ON admin_users FOR ALL USING (false);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_admin_users_updated_at();

-- ============================================================
-- 2. Extend tenants table
-- ============================================================

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_ends_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS country         TEXT NOT NULL DEFAULT 'co',
  ADD COLUMN IF NOT EXISTS internal_notes  TEXT,
  ADD COLUMN IF NOT EXISTS created_by_admin UUID REFERENCES admin_users(id);

-- Indexes for backoffice queries
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_expires ON tenants(plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_tenants_country ON tenants(country);

-- ============================================================
-- 3. Rename plan 'starter' → 'esencial'
-- ============================================================

-- First update existing rows
UPDATE tenants SET plan = 'esencial' WHERE plan = 'starter';

-- Drop old constraint and set new one
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS tenants_plan_check;
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_check
  CHECK (plan IN ('esencial', 'pro', 'campaign', 'enterprise'));

-- Update default
ALTER TABLE tenants ALTER COLUMN plan SET DEFAULT 'esencial';
