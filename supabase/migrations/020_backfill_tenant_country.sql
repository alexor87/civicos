-- ============================================================
-- Migration 020: Backfill country = 'colombia' en tenants existentes
-- Asigna Colombia a todos los tenants que no tengan país configurado
-- ============================================================

UPDATE tenants
SET settings = jsonb_set(
  COALESCE(settings, '{}'),
  '{country}',
  '"colombia"'
)
WHERE settings->>'country' IS NULL;
