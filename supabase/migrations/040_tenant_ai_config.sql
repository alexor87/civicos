-- 040_tenant_ai_config.sql
-- Configurable AI models per tenant/campaign (BYO Key)

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE tenant_ai_config (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  campaign_id      uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  provider         text NOT NULL CHECK (provider IN ('anthropic','openai','google','mistral','groq')),
  model            text NOT NULL,
  api_key_encrypted text NOT NULL,
  api_key_hint     text NOT NULL,
  is_valid         boolean DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- One config per tenant+campaign combo (NULL campaign_id = tenant default)
CREATE UNIQUE INDEX uq_tenant_ai_config_tenant_campaign
  ON tenant_ai_config (tenant_id, COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'));

-- ── Encryption helpers ───────────────────────────────────────────────────────
-- Uses a server-side secret stored in Supabase env (AI_ENCRYPTION_KEY)
-- Falls back to a default for development only

CREATE OR REPLACE FUNCTION encrypt_ai_key(raw text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(raw, current_setting('app.ai_encryption_key', true)),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_ai_key(encrypted text)
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

CREATE OR REPLACE FUNCTION update_ai_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ai_config_updated_at
  BEFORE UPDATE ON tenant_ai_config
  FOR EACH ROW EXECUTE FUNCTION update_ai_config_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE tenant_ai_config ENABLE ROW LEVEL SECURITY;

-- Users can view configs for their own tenant
CREATE POLICY "Users can view own tenant AI config"
  ON tenant_ai_config FOR SELECT
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p WHERE p.id = auth.uid()
    )
  );

-- Only super_admin and campaign_manager can insert/update/delete
CREATE POLICY "Admins can manage AI config"
  ON tenant_ai_config FOR ALL
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'campaign_manager')
    )
  );

-- Service role bypass (for Edge Functions)
-- Service role key always bypasses RLS by default in Supabase
