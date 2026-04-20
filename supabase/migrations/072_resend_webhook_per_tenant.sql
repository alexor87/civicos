-- Migration 072: Per-tenant Resend webhook secret
-- Each tenant stores their own Resend webhook signing secret (encrypted)

ALTER TABLE tenant_integrations
  ADD COLUMN IF NOT EXISTS resend_webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS resend_webhook_secret_hint TEXT;
