-- Migration 005: Contact Segments
-- Dynamic saved filter sets for CRM contacts

CREATE TABLE IF NOT EXISTS contact_segments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  campaign_id  UUID REFERENCES campaigns(id),
  name         TEXT NOT NULL,
  description  TEXT,
  filters      JSONB NOT NULL DEFAULT '[]',
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON contact_segments
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX IF NOT EXISTS idx_contact_segments_campaign ON contact_segments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contact_segments_tenant  ON contact_segments(tenant_id);
