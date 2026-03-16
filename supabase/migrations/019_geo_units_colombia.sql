-- ============================================================
-- Migration 019: Geo Units — Soporte jerarquía Colombia
-- Extiende tipos: localidad, upz, comuna, corregimiento, vereda
-- Corrige UNIQUE constraint para permitir mismo nombre bajo
-- distintos padres (ej: "Centro" en Medellín y en Bogotá)
-- ============================================================

-- 1. Extender CHECK constraint de tipos válidos
ALTER TABLE geo_units DROP CONSTRAINT geo_units_type_check;
ALTER TABLE geo_units ADD CONSTRAINT geo_units_type_check
  CHECK (type IN (
    'departamento',
    'municipio',
    'localidad',
    'upz',
    'comuna',
    'corregimiento',
    'barrio',
    'vereda'
  ));

-- 2. Reemplazar UNIQUE simple con dos índices parciales
--    Root nodes (sin padre): único por (campaign_id, type, name)
--    Child nodes: único por (campaign_id, type, name, parent_id)
ALTER TABLE geo_units DROP CONSTRAINT geo_units_campaign_id_type_name_key;

CREATE UNIQUE INDEX geo_units_unique_root
  ON geo_units(campaign_id, type, name)
  WHERE parent_id IS NULL;

CREATE UNIQUE INDEX geo_units_unique_child
  ON geo_units(campaign_id, type, name, parent_id)
  WHERE parent_id IS NOT NULL;

COMMENT ON TABLE geo_units IS 'Catálogo geográfico por campaña: departamentos, municipios, localidades, UPZ, comunas, corregimientos, barrios y veredas';
