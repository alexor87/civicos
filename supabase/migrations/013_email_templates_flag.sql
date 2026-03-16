-- Add is_template flag to email_campaigns
-- Templates are reusable email content (no segment, no send).
-- Campaigns are one-time sends to a segment.

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT false;
