-- Migration 071: Email campaign analytics tracking
-- Adds per-recipient tracking table and denormalized counters for email metrics

-- Per-recipient tracking (correlates with Resend webhook events)
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL,
  resend_email_id   TEXT NOT NULL,
  recipient_email   TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'sent',
  delivered_at      TIMESTAMPTZ,
  opened_at         TIMESTAMPTZ,
  clicked_at        TIMESTAMPTZ,
  bounced_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ecr_campaign ON email_campaign_recipients(email_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ecr_resend_id ON email_campaign_recipients(resend_email_id);

ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON email_campaign_recipients
  FOR SELECT USING (
    email_campaign_id IN (
      SELECT id FROM email_campaigns
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- Denormalized counters on email_campaigns for fast reads
ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opened_count   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicked_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bounced_count  INTEGER DEFAULT 0;

-- RPC for atomic counter increment (used by webhook handler)
CREATE OR REPLACE FUNCTION increment_email_campaign_counter(
  p_campaign_id UUID,
  p_column TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE format(
    'UPDATE email_campaigns SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    p_column, p_column
  ) USING p_campaign_id;
END;
$$;
