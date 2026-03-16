-- Migration 024: Seedear coordenadas GPS de Rionegro en contactos demo + RPC get_contact_points

-- 1. Seedear coordenadas en contactos demo que no tienen geo aún
--    Dispersa los contactos alrededor del centro de Rionegro (lat 6.1543, lng -75.3744)
UPDATE contacts
SET geo = ST_SetSRID(
  ST_MakePoint(
    -75.3744 + (RANDOM() - 0.5) * 0.025,
     6.1543  + (RANDOM() - 0.5) * 0.025
  ), 4326
)
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
  AND geo IS NULL;

-- 2. RPC: devuelve lat/lng + último resultado de visita por contacto
--    Usada por el mapa de calor del dashboard de canvassing
CREATE OR REPLACE FUNCTION get_contact_points(p_campaign_id UUID)
RETURNS TABLE(id UUID, lat FLOAT8, lng FLOAT8, last_result TEXT)
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT
    c.id,
    ST_Y(c.geo::geometry)::FLOAT8 AS lat,
    ST_X(c.geo::geometry)::FLOAT8 AS lng,
    cv.result                      AS last_result
  FROM contacts c
  LEFT JOIN LATERAL (
    SELECT result
    FROM canvass_visits
    WHERE contact_id = c.id
      AND campaign_id = p_campaign_id
    ORDER BY created_at DESC
    LIMIT 1
  ) cv ON true
  WHERE c.campaign_id = p_campaign_id
    AND c.geo IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION get_contact_points(UUID) TO anon, authenticated;
