-- Brand Studio: per-tenant branding configuration
CREATE TABLE IF NOT EXISTS tenant_branding (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Logos & images
  logo_url             TEXT,
  candidate_photo_url  TEXT,

  -- Color tokens (5-token system)
  color_primary        TEXT        NOT NULL DEFAULT '#2960ec',
  color_secondary      TEXT        NOT NULL DEFAULT '#1e293b',
  color_accent         TEXT        NOT NULL DEFAULT '#ea580c',
  color_background     TEXT        NOT NULL DEFAULT '#f8fafc',
  color_surface        TEXT        NOT NULL DEFAULT '#ffffff',

  -- Text identity
  slogan               TEXT,
  candidate_name       TEXT,
  candidate_role       TEXT,

  -- Meta
  onboarding_completed BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tenant_branding_tenant_id_unique UNIQUE (tenant_id)
);

-- RLS
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant members can manage own branding"
  ON tenant_branding
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_tenant_branding_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tenant_branding_updated_at
  BEFORE UPDATE ON tenant_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_branding_updated_at();
