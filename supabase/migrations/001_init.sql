-- ============================================================
-- Scrutix — Migration 001: Initial Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'super_admin', 'campaign_manager', 'field_coordinator', 'volunteer', 'analyst'
);

CREATE TYPE contact_status AS ENUM (
  'undecided', 'supporter', 'opponent', 'unknown'
);

CREATE TYPE visit_result AS ENUM (
  'positive', 'negative', 'undecided', 'no_home', 'follow_up', 'refused'
);

CREATE TYPE suggestion_status AS ENUM (
  'active', 'pending_approval', 'approved', 'rejected', 'applied', 'dismissed'
);

CREATE TYPE agent_run_status AS ENUM (
  'running', 'completed', 'failed', 'pending_approval'
);

CREATE TYPE suggestion_priority AS ENUM (
  'critical', 'high', 'medium', 'low'
);

CREATE TYPE campaign_channel AS ENUM (
  'email', 'sms', 'whatsapp'
);

-- ============================================================
-- TENANTS (Org root — no tenant_id FK, this IS the root)
-- ============================================================

CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','pro','campaign','enterprise')),
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================

CREATE TABLE campaigns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  election_date DATE,
  config        JSONB NOT NULL DEFAULT '{}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_tenant ON campaigns(tenant_id);

-- ============================================================
-- TEAMS
-- ============================================================

CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_campaign ON teams(campaign_id);

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role         user_role NOT NULL DEFAULT 'volunteer',
  campaign_ids UUID[] NOT NULL DEFAULT '{}',
  full_name    TEXT,
  avatar_url   TEXT,
  preferences  JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);

-- ============================================================
-- CONTACTS (CRM core)
-- ============================================================

CREATE TABLE contacts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
  email        TEXT,
  phone        TEXT,
  address      TEXT,
  city         TEXT,
  district     TEXT,
  status       contact_status NOT NULL DEFAULT 'unknown',
  tags         TEXT[] NOT NULL DEFAULT '{}',
  notes        TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  -- PostGIS geo point
  geo          GEOGRAPHY(POINT, 4326),
  -- pgvector embedding for semantic search
  embedding    VECTOR(1536),
  -- Full-text search
  search_vec   TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('spanish',
      COALESCE(first_name,'') || ' ' ||
      COALESCE(last_name,'') || ' ' ||
      COALESCE(email,'') || ' ' ||
      COALESCE(phone,'') || ' ' ||
      COALESCE(city,'') || ' ' ||
      COALESCE(district,'')
    )
  ) STORED,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_campaign ON contacts(campaign_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vec);
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_phone ON contacts(phone) WHERE phone IS NOT NULL;

-- ============================================================
-- CANVASS ZONES
-- ============================================================

CREATE TABLE canvass_zones (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  geojson          JSONB,
  assigned_team_id UUID REFERENCES teams(id),
  target_contacts  INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_campaign ON canvass_zones(campaign_id);

-- ============================================================
-- CANVASS VISITS
-- ============================================================

CREATE TABLE canvass_visits (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id   UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  zone_id      UUID REFERENCES canvass_zones(id),
  volunteer_id UUID NOT NULL REFERENCES profiles(id),
  result       visit_result NOT NULL,
  notes        TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  geo          GEOGRAPHY(POINT, 4326),
  synced_at    TIMESTAMPTZ,
  approved_at  TIMESTAMPTZ,
  approved_by  UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visits_campaign ON canvass_visits(campaign_id);
CREATE INDEX idx_visits_contact ON canvass_visits(contact_id);
CREATE INDEX idx_visits_volunteer ON canvass_visits(volunteer_id);
CREATE INDEX idx_visits_result ON canvass_visits(result);

-- ============================================================
-- COMMUNICATIONS
-- ============================================================

CREATE TABLE communications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  channel      campaign_channel NOT NULL,
  subject      TEXT,
  content      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  metrics      JSONB NOT NULL DEFAULT '{}',
  created_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comms_campaign ON communications(campaign_id);

-- ============================================================
-- AI SUGGESTIONS
-- ============================================================

CREATE TABLE ai_suggestions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id      UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,
  module           TEXT NOT NULL,
  priority         suggestion_priority NOT NULL DEFAULT 'medium',
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  reasoning        TEXT,
  estimated_impact TEXT,
  action_payload   JSONB NOT NULL DEFAULT '{}',
  agent_id         TEXT,
  status           suggestion_status NOT NULL DEFAULT 'active',
  feedback         TEXT,
  applied_at       TIMESTAMPTZ,
  dismissed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suggestions_campaign ON ai_suggestions(campaign_id);
CREATE INDEX idx_suggestions_status ON ai_suggestions(status);
CREATE INDEX idx_suggestions_priority ON ai_suggestions(priority);

-- ============================================================
-- AGENT RUNS
-- ============================================================

CREATE TABLE agent_runs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  agent_id     TEXT NOT NULL,
  workflow_id  TEXT NOT NULL,
  status       agent_run_status NOT NULL DEFAULT 'running',
  trigger      TEXT NOT NULL,
  steps        JSONB NOT NULL DEFAULT '[]',
  result       JSONB NOT NULL DEFAULT '{}',
  error        TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_runs_campaign ON agent_runs(campaign_id);
CREATE INDEX idx_agent_runs_status ON agent_runs(status);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_comms_updated_at BEFORE UPDATE ON communications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_suggestions_updated_at BEFORE UPDATE ON ai_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'volunteer'),
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
