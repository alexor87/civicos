-- 069_fix_integration_encryption.sql
-- Fix encrypt/decrypt_integration_key to read from app_secrets table
-- instead of current_setting('app.ai_encryption_key') which is not set.
-- Matches the pattern from 042_set_encryption_key.sql.

CREATE OR REPLACE FUNCTION encrypt_integration_key(raw text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  enc_key text;
BEGIN
  SELECT value INTO enc_key FROM app_secrets WHERE key = 'ai_encryption_key';
  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured in app_secrets';
  END IF;
  RETURN encode(pgp_sym_encrypt(raw, enc_key), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_integration_key(encrypted text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  enc_key text;
BEGIN
  SELECT value INTO enc_key FROM app_secrets WHERE key = 'ai_encryption_key';
  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured in app_secrets';
  END IF;
  RETURN pgp_sym_decrypt(decode(encrypted, 'base64'), enc_key);
END;
$$;
