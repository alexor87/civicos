-- ============================================================
-- Migration 018: Geo Units — Base geográfica por campaña
-- Soporta jerarquía: departamento → municipio → barrio
-- ============================================================

CREATE TABLE IF NOT EXISTS geo_units (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  type        TEXT NOT NULL CHECK (type IN ('departamento', 'municipio', 'barrio')),
  name        TEXT NOT NULL,
  code        TEXT,           -- código oficial (DANE, INE, INDEC, etc.)
  parent_id   UUID REFERENCES geo_units(id) ON DELETE SET NULL,
  geojson     JSONB,          -- GeoJSON Polygon/MultiPolygon opcional
  population  INTEGER,        -- dato demográfico opcional
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unicidad: no duplicar el mismo nombre+tipo dentro de una campaña
  UNIQUE (campaign_id, type, name)
);

ALTER TABLE geo_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "geo_units_tenant_isolation" ON geo_units
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::UUID);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_geo_units_campaign  ON geo_units(campaign_id);
CREATE INDEX IF NOT EXISTS idx_geo_units_type      ON geo_units(campaign_id, type);
CREATE INDEX IF NOT EXISTS idx_geo_units_parent    ON geo_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_geo_units_code      ON geo_units(campaign_id, code) WHERE code IS NOT NULL;

COMMENT ON TABLE geo_units IS 'Catálogo geográfico por campaña: departamentos, municipios y barrios con jerarquía y polígonos opcionales';
COMMENT ON COLUMN geo_units.geojson IS 'GeoJSON Feature (Polygon o MultiPolygon) para visualización en mapas';
COMMENT ON COLUMN geo_units.code IS 'Código oficial de la unidad geográfica (ej: código DANE en Colombia)';
