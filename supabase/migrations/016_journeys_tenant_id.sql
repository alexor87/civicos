-- Migration 016: Add tenant_id to journeys and journey_enrollments
-- Replaces fragile subquery-based RLS with direct tenant_id equality check.

ALTER TABLE journeys
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

ALTER TABLE journey_enrollments
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Backfill tenant_id from the campaign's tenant_id
UPDATE journeys j
SET tenant_id = c.tenant_id
FROM campaigns c
WHERE j.campaign_id = c.id AND j.tenant_id IS NULL;

UPDATE journey_enrollments je
SET tenant_id = j.tenant_id
FROM journeys j
WHERE je.journey_id = j.id AND je.tenant_id IS NULL;

-- Drop old subquery-based policies
DROP POLICY IF EXISTS "tenant journeys"     ON journeys;
DROP POLICY IF EXISTS "tenant enrollments"  ON journey_enrollments;

-- New simpler policies using direct tenant_id check
CREATE POLICY "tenant journeys" ON journeys
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "tenant enrollments" ON journey_enrollments
  USING (tenant_id = auth_tenant_id());

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_journeys_tenant_id ON journeys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journey_enrollments_tenant_id ON journey_enrollments(tenant_id);
