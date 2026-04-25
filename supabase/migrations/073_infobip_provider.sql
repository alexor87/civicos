-- ─────────────────────────────────────────────────────────────────────────────
-- Multi-provider messaging: add Infobip as second provider for SMS / WhatsApp.
-- ─────────────────────────────────────────────────────────────────────────────
-- Additive migration. Twilio columns are NOT touched. Existing tenants keep
-- working with Twilio (default) until they explicitly switch.
--
-- New columns:
--   - sms_provider, whatsapp_provider: which provider is active per channel
--   - infobip_*: Infobip credentials, mirroring twilio_* layout

ALTER TABLE tenant_integrations
  ADD COLUMN IF NOT EXISTS sms_provider      text NOT NULL DEFAULT 'twilio',
  ADD COLUMN IF NOT EXISTS whatsapp_provider text NOT NULL DEFAULT 'twilio',
  ADD COLUMN IF NOT EXISTS infobip_api_key      text,
  ADD COLUMN IF NOT EXISTS infobip_api_key_hint text,
  ADD COLUMN IF NOT EXISTS infobip_base_url     text,
  ADD COLUMN IF NOT EXISTS infobip_sms_from     text,
  ADD COLUMN IF NOT EXISTS infobip_whatsapp_from text;

ALTER TABLE tenant_integrations
  DROP CONSTRAINT IF EXISTS tenant_integrations_sms_provider_check;
ALTER TABLE tenant_integrations
  ADD CONSTRAINT tenant_integrations_sms_provider_check
    CHECK (sms_provider IN ('twilio', 'infobip'));

ALTER TABLE tenant_integrations
  DROP CONSTRAINT IF EXISTS tenant_integrations_whatsapp_provider_check;
ALTER TABLE tenant_integrations
  ADD CONSTRAINT tenant_integrations_whatsapp_provider_check
    CHECK (whatsapp_provider IN ('twilio', 'infobip'));

COMMENT ON COLUMN tenant_integrations.sms_provider IS
  'Active SMS provider for this tenant/campaign. Defaults to twilio.';
COMMENT ON COLUMN tenant_integrations.whatsapp_provider IS
  'Active WhatsApp provider for this tenant/campaign. Defaults to twilio.';
COMMENT ON COLUMN tenant_integrations.infobip_api_key IS
  'pgp_sym_encrypted Infobip API key (uses same encrypt_integration_key flow as twilio_token).';
COMMENT ON COLUMN tenant_integrations.infobip_base_url IS
  'Infobip personal base URL assigned to the account, e.g. "55eexx.api.infobip.com" (no protocol).';
COMMENT ON COLUMN tenant_integrations.infobip_sms_from IS
  'Sender ID or number used as From for SMS sent via Infobip.';
COMMENT ON COLUMN tenant_integrations.infobip_whatsapp_from IS
  'WhatsApp sender number registered with Infobip / Meta.';
