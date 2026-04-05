-- ============================================================
-- 051_backfill_contact_geo.sql — RPC to populate geo from lat/lng
-- ============================================================
-- Used by seed-demo-campaign Edge Function after inserting contacts
-- with location_lat/location_lng to backfill the PostGIS geo column.

CREATE OR REPLACE FUNCTION backfill_contact_geo(p_campaign_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE contacts
  SET geo = ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)
  WHERE campaign_id = p_campaign_id
    AND location_lat IS NOT NULL
    AND location_lng IS NOT NULL
    AND geo IS NULL;
$$;
