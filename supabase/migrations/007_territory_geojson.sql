-- Migration 007: Add geojson column to territories
-- Stores GeoJSON polygon/multipolygon for map visualization

ALTER TABLE territories ADD COLUMN IF NOT EXISTS geojson JSONB;

COMMENT ON COLUMN territories.geojson IS 'GeoJSON Feature con la geometría del territorio (Polygon o MultiPolygon)';
