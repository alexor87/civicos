-- 041_security_hardening.sql
-- Security hardening for tenant AI config: restrict decrypt/encrypt functions
-- and hide api_key_encrypted column from non-service roles.

-- ── Restrict decrypt_ai_key to service_role only ─────────────────────────────
REVOKE EXECUTE ON FUNCTION decrypt_ai_key(text) FROM public;
REVOKE EXECUTE ON FUNCTION decrypt_ai_key(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION decrypt_ai_key(text) FROM anon;
GRANT EXECUTE ON FUNCTION decrypt_ai_key(text) TO service_role;

-- ── Restrict encrypt_ai_key to service_role only ─────────────────────────────
REVOKE EXECUTE ON FUNCTION encrypt_ai_key(text) FROM public;
REVOKE EXECUTE ON FUNCTION encrypt_ai_key(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION encrypt_ai_key(text) FROM anon;
GRANT EXECUTE ON FUNCTION encrypt_ai_key(text) TO service_role;

-- ── Hide api_key_encrypted column from non-service roles ─────────────────────
REVOKE SELECT (api_key_encrypted) ON tenant_ai_config FROM authenticated;
REVOKE SELECT (api_key_encrypted) ON tenant_ai_config FROM anon;
