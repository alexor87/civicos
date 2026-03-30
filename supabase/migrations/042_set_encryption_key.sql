-- 042_set_encryption_key.sql
-- Store encryption key in a private table instead of GUC (which requires superuser).
-- Only service_role can access this table.

-- ── Secret storage table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_secrets (
  key   text PRIMARY KEY,
  value text NOT NULL
);

-- No RLS — only service_role can access
ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;

-- Revoke all access from public roles
REVOKE ALL ON app_secrets FROM public;
REVOKE ALL ON app_secrets FROM authenticated;
REVOKE ALL ON app_secrets FROM anon;

-- Insert the encryption key (generated once, never changes)
INSERT INTO app_secrets (key, value)
VALUES ('ai_encryption_key', gen_random_uuid()::text || '-' || gen_random_uuid()::text)
ON CONFLICT (key) DO NOTHING;

-- ── Update encrypt/decrypt functions to read from app_secrets ─────────────────

CREATE OR REPLACE FUNCTION encrypt_ai_key(raw text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  enc_key text;
BEGIN
  SELECT value INTO enc_key FROM app_secrets WHERE key = 'ai_encryption_key';
  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  RETURN encode(pgp_sym_encrypt(raw, enc_key), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_ai_key(encrypted text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  enc_key text;
BEGIN
  SELECT value INTO enc_key FROM app_secrets WHERE key = 'ai_encryption_key';
  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured';
  END IF;
  RETURN pgp_sym_decrypt(decode(encrypted, 'base64'), enc_key);
END;
$$;
