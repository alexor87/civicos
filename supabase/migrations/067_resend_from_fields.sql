-- Add sender identity fields for Resend email integration
ALTER TABLE tenant_integrations
  ADD COLUMN IF NOT EXISTS resend_from_name  text,
  ADD COLUMN IF NOT EXISTS resend_from_email text;

COMMENT ON COLUMN tenant_integrations.resend_from_name  IS 'Display name for email sender (e.g. "Campaña Juan Esteban")';
COMMENT ON COLUMN tenant_integrations.resend_from_email IS 'Email prefix before @domain (e.g. "contacto" for contacto@domain.com)';
