-- Migration 044: Geocodificación de contactos
-- Agrega columnas de lat/lng, estado de geocodificación, RPCs y índices

-- 1. Nuevas columnas en contacts
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS location_lat        DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS location_lng        DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS geocoding_status    TEXT NOT NULL DEFAULT 'pending'
    CHECK (geocoding_status IN ('pending', 'geocoded', 'manual_pin', 'failed')),
  ADD COLUMN IF NOT EXISTS geocoding_type      TEXT
    CHECK (geocoding_type IN ('google_maps', 'manual')),
  ADD COLUMN IF NOT EXISTS geocoding_precision TEXT;

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_contacts_geocoding_status
  ON contacts(campaign_id, geocoding_status);

CREATE INDEX IF NOT EXISTS idx_contacts_geo_existing
  ON contacts USING GIST(geo)
  WHERE geo IS NOT NULL;

-- 3. RPC: actualizar geo desde geocodificación automática
CREATE OR REPLACE FUNCTION update_contact_geo(
  p_contact_id UUID,
  p_lat        DECIMAL,
  p_lng        DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE contacts
  SET
    geo                = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
    location_lat       = p_lat,
    location_lng       = p_lng,
    geocoding_status   = 'geocoded',
    geocoding_type     = 'google_maps',
    updated_at         = NOW()
  WHERE id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_contact_geo(UUID, DECIMAL, DECIMAL) TO authenticated;

-- 4. RPC: actualizar geo desde pin manual
CREATE OR REPLACE FUNCTION update_contact_geo_manual(
  p_contact_id UUID,
  p_lat        DECIMAL,
  p_lng        DECIMAL
)
RETURNS VOID AS $$
BEGIN
  UPDATE contacts
  SET
    geo                 = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
    location_lat        = p_lat,
    location_lng        = p_lng,
    geocoding_status    = 'manual_pin',
    geocoding_type      = 'manual',
    geocoding_precision = NULL,
    updated_at          = NOW()
  WHERE id = p_contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_contact_geo_manual(UUID, DECIMAL, DECIMAL) TO authenticated;
