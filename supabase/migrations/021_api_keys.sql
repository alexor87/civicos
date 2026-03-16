-- ============================================================
-- CivicOS — Migration 021: Public API Keys
-- ============================================================

CREATE TABLE api_keys (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id   UUID        NOT NULL,
  name          TEXT        NOT NULL,
  key_hash      TEXT        NOT NULL UNIQUE,   -- SHA-256 of full key
  key_prefix    TEXT        NOT NULL,           -- first 12 chars, e.g. "cvk_abc12345"
  scopes        TEXT[]      NOT NULL DEFAULT ARRAY['contacts:read'],
  created_by    UUID        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Campaign members can manage their own campaign's keys
CREATE POLICY "api_keys_campaign_access" ON api_keys
  FOR ALL USING (
    campaign_id IN (
      SELECT unnest(campaign_ids) FROM profiles WHERE id = auth.uid()
    )
  );

-- Super admins can access all
CREATE POLICY "api_keys_super_admin" ON api_keys
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE INDEX idx_api_keys_campaign ON api_keys (campaign_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys (key_hash) WHERE revoked_at IS NULL;
