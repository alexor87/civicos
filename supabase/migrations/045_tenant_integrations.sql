-- 045_tenant_integrations.sql
-- Centralize integration credentials at tenant level (with campaign override)
-- Follows the pattern established by tenant_ai_config (migration 040)

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE tenant_integrations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id           uuid REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Resend (Email)
  resend_api_key        text,
  resend_api_key_hint   text,
  resend_domain         text,

  -- Twilio (SMS)
  twilio_sid            text,
  twilio_token          text,
  twilio_token_hint     text,
  twilio_from           text,

  -- WhatsApp (Twilio)
  twilio_whatsapp_from  text,

  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

-- One config per tenant+campaign combo (NULL campaign_id = tenant default)
CREATE UNIQUE INDEX uq_tenant_integrations_tenant_campaign
  ON tenant_integrations (tenant_id, COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'));

-- ── Encryption helpers ───────────────────────────────────────────────────────
-- Reuses the same encryption key as tenant_ai_config (app.ai_encryption_key)

CREATE OR REPLACE FUNCTION encrypt_integration_key(raw text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(raw, current_setting('app.ai_encryption_key', true)),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_integration_key(encrypted text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN pgp_sym_decrypt(
    decode(encrypted, 'base64'),
    current_setting('app.ai_encryption_key', true)
  );
END;
$$;

-- ── Updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_integrations_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_integrations_updated_at
  BEFORE UPDATE ON tenant_integrations
  FOR EACH ROW EXECUTE FUNCTION update_integrations_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE tenant_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant integrations"
  ON tenant_integrations FOR SELECT
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage integrations"
  ON tenant_integrations FOR ALL
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'campaign_manager')
    )
  );

-- ── Migrate existing data from campaigns ─────────────────────────────────────
-- Handle gracefully: twilio_whatsapp_from may not exist in older deployments

DO $$
DECLARE
  has_wa_col boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'twilio_whatsapp_from'
  ) INTO has_wa_col;

  IF has_wa_col THEN
    INSERT INTO tenant_integrations (
      tenant_id, campaign_id,
      resend_domain,
      twilio_sid, twilio_token, twilio_from,
      twilio_whatsapp_from
    )
    SELECT
      c.tenant_id, c.id,
      c.resend_domain,
      c.twilio_sid, c.twilio_token, c.twilio_from,
      c.twilio_whatsapp_from
    FROM campaigns c
    WHERE c.resend_domain IS NOT NULL
       OR c.twilio_sid IS NOT NULL
       OR c.twilio_whatsapp_from IS NOT NULL;
  ELSE
    INSERT INTO tenant_integrations (
      tenant_id, campaign_id,
      resend_domain,
      twilio_sid, twilio_token, twilio_from
    )
    SELECT
      c.tenant_id, c.id,
      c.resend_domain,
      c.twilio_sid, c.twilio_token, c.twilio_from
    FROM campaigns c
    WHERE c.resend_domain IS NOT NULL
       OR c.twilio_sid IS NOT NULL;
  END IF;
END;
$$;
