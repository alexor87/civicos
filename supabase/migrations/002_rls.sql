-- ============================================================
-- Scrutix — Migration 002: Row Level Security Policies
-- ============================================================

-- Helper function to get tenant_id from JWT
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() ->> 'tenant_id')::UUID;
$$ LANGUAGE SQL STABLE;

-- Helper function to get role from JWT
CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'role';
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- TENANTS
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (id = auth_tenant_id());

CREATE POLICY "tenants_update_admin" ON tenants
  FOR UPDATE USING (id = auth_tenant_id() AND auth_role() IN ('super_admin'));

-- ============================================================
-- CAMPAIGNS
-- ============================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select" ON campaigns
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY "campaigns_insert" ON campaigns
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

CREATE POLICY "campaigns_update" ON campaigns
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

CREATE POLICY "campaigns_delete" ON campaigns
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() = 'super_admin'
  );

-- ============================================================
-- TEAMS
-- ============================================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select" ON teams
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY "teams_insert" ON teams
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager', 'field_coordinator')
  );

CREATE POLICY "teams_update" ON teams
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles in their tenant
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (tenant_id = auth_tenant_id());

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid() AND tenant_id = auth_tenant_id());

-- Admins can update any profile in their tenant
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

-- ============================================================
-- CONTACTS
-- ============================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager', 'field_coordinator')
  );

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager', 'field_coordinator')
  );

CREATE POLICY "contacts_delete" ON contacts
  FOR DELETE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

-- ============================================================
-- CANVASS ZONES
-- ============================================================
ALTER TABLE canvass_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zones_select" ON canvass_zones
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY "zones_insert" ON canvass_zones
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager', 'field_coordinator')
  );

CREATE POLICY "zones_update" ON canvass_zones
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager', 'field_coordinator')
  );

-- ============================================================
-- CANVASS VISITS
-- ============================================================
ALTER TABLE canvass_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visits_select" ON canvass_visits
  FOR SELECT USING (tenant_id = auth_tenant_id());

-- Volunteers can only insert their own visits
CREATE POLICY "visits_insert" ON canvass_visits
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND (
      auth_role() IN ('super_admin', 'campaign_manager', 'field_coordinator')
      OR (auth_role() = 'volunteer' AND volunteer_id = auth.uid())
    )
  );

-- Only coordinators+ can approve visits
CREATE POLICY "visits_update" ON canvass_visits
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager', 'field_coordinator')
  );

-- ============================================================
-- COMMUNICATIONS
-- ============================================================
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comms_select" ON communications
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY "comms_insert" ON communications
  FOR INSERT WITH CHECK (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

CREATE POLICY "comms_update" ON communications
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );

-- ============================================================
-- AI SUGGESTIONS
-- ============================================================
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suggestions_select" ON ai_suggestions
  FOR SELECT USING (tenant_id = auth_tenant_id());

-- Only service role (agents) can insert; users can update status/feedback
CREATE POLICY "suggestions_update" ON ai_suggestions
  FOR UPDATE USING (tenant_id = auth_tenant_id());

-- ============================================================
-- AGENT RUNS
-- ============================================================
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_runs_select" ON agent_runs
  FOR SELECT USING (tenant_id = auth_tenant_id());

CREATE POLICY "agent_runs_update_admin" ON agent_runs
  FOR UPDATE USING (
    tenant_id = auth_tenant_id()
    AND auth_role() IN ('super_admin', 'campaign_manager')
  );
