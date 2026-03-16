-- Migration 015: Public volunteer registration
-- Enables a public registration URL per campaign for volunteer sign-ups.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS volunteer_registration_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN campaigns.volunteer_registration_enabled IS 'Habilita el formulario público de registro de voluntarios para esta campaña';
