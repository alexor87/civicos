-- 060_clustered_contacts_level.sql
-- Add contact_level to get_clustered_contacts RPC return type
-- For single contacts: returns the actual contact_level
-- For clusters: returns the dominant (most common) contact_level

CREATE OR REPLACE FUNCTION get_clustered_contacts(
  p_campaign_id UUID,
  p_min_lat     FLOAT8,
  p_min_lng     FLOAT8,
  p_max_lat     FLOAT8,
  p_max_lng     FLOAT8,
  p_zoom        INT
)
RETURNS TABLE(
  cluster_id      TEXT,
  lat             FLOAT8,
  lng             FLOAT8,
  point_count     INT,
  contact_id      UUID,
  dominant_status TEXT,
  dominant_result TEXT,
  contact_level   TEXT
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH params AS (
    SELECT
      CASE
        WHEN p_zoom >= 18 THEN 0.0005
        WHEN p_zoom >= 16 THEN 0.001
        WHEN p_zoom >= 14 THEN 0.005
        WHEN p_zoom >= 12 THEN 0.01
        WHEN p_zoom >= 10 THEN 0.05
        WHEN p_zoom >= 8  THEN 0.1
        ELSE 0.5
      END AS grid_size
  ),
  geo_contacts AS (
    SELECT
      c.id,
      c.location_lat,
      c.location_lng,
      c.status,
      c.contact_level AS c_level,
      FLOOR(c.location_lat / p.grid_size)::BIGINT AS lat_cell,
      FLOOR(c.location_lng / p.grid_size)::BIGINT AS lng_cell
    FROM contacts c, params p
    WHERE c.campaign_id = p_campaign_id
      AND c.location_lat IS NOT NULL
      AND c.location_lng IS NOT NULL
      AND c.location_lat BETWEEN p_min_lat::NUMERIC AND p_max_lat::NUMERIC
      AND c.location_lng BETWEEN p_min_lng::NUMERIC AND p_max_lng::NUMERIC
  ),
  clustered AS (
    SELECT
      lat_cell::TEXT || '_' || lng_cell::TEXT AS cell_id,
      AVG(gc.location_lat)::FLOAT8                           AS avg_lat,
      AVG(gc.location_lng)::FLOAT8                           AS avg_lng,
      COUNT(*)::INT                                           AS cnt,
      CASE WHEN COUNT(*) = 1 THEN (ARRAY_AGG(gc.id))[1] ELSE NULL END AS single_id,
      MODE() WITHIN GROUP (ORDER BY gc.status)                AS dom_status,
      MODE() WITHIN GROUP (ORDER BY gc.c_level)               AS dom_level
    FROM geo_contacts gc
    GROUP BY lat_cell, lng_cell
  )
  SELECT
    cl.cell_id     AS cluster_id,
    cl.avg_lat     AS lat,
    cl.avg_lng     AS lng,
    cl.cnt         AS point_count,
    cl.single_id   AS contact_id,
    cl.dom_status  AS dominant_status,
    cv.result::TEXT AS dominant_result,
    cl.dom_level::TEXT AS contact_level
  FROM clustered cl
  LEFT JOIN LATERAL (
    SELECT result FROM canvass_visits
    WHERE contact_id = cl.single_id AND campaign_id = p_campaign_id
    ORDER BY created_at DESC LIMIT 1
  ) cv ON cl.single_id IS NOT NULL;
$$;
