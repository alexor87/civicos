-- Migration 006: Email Campaigns
-- Stores email campaign drafts and their send results

CREATE TABLE IF NOT EXISTS email_campaigns (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id),
  campaign_id      UUID REFERENCES campaigns(id),
  name             TEXT NOT NULL,
  subject          TEXT NOT NULL,
  body_html        TEXT NOT NULL,
  body_text        TEXT,
  segment_id       UUID REFERENCES contact_segments(id),   -- NULL = all contacts
  status           TEXT NOT NULL DEFAULT 'draft',          -- draft | sent | failed
  recipient_count  INTEGER DEFAULT 0,
  sent_at          TIMESTAMPTZ,
  created_by       UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON email_campaigns
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_campaign ON email_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_tenant   ON email_campaigns(tenant_id);
