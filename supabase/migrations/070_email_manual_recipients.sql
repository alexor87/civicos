-- 070_email_manual_recipients.sql
-- Add recipient_ids column for manual contact selection in email campaigns.
-- When recipient_ids is NOT NULL, it overrides segment_id / "all contacts".

ALTER TABLE email_campaigns
  ADD COLUMN IF NOT EXISTS recipient_ids uuid[];

COMMENT ON COLUMN email_campaigns.recipient_ids IS 'Manually selected contact IDs. When set, overrides segment_id.';
