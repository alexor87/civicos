-- ============================================================
-- Migration 055: Scaling Phase 1 — Performance optimizations
-- campaign_stats, cursor pagination, full-text search,
-- import dedup indexes, map clustering RPC
-- ============================================================

-- ------------------------------------------------------------
-- 1. campaign_stats — trigger-maintained counters (O(1) reads)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS campaign_stats (
  campaign_id     UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  total_contacts  BIGINT NOT NULL DEFAULT 0,
  supporters      BIGINT NOT NULL DEFAULT 0,
  undecided       BIGINT NOT NULL DEFAULT 0,
  opponents       BIGINT NOT NULL DEFAULT 0,
  unknown         BIGINT NOT NULL DEFAULT 0,
  geocoded        BIGINT NOT NULL DEFAULT 0,
  total_visits    BIGINT NOT NULL DEFAULT 0,
  pending_visits  BIGINT NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_stats_select" ON campaign_stats
  FOR SELECT USING (
    campaign_id IN (
      SELECT unnest(campaign_ids) FROM profiles WHERE id = auth.uid()
    )
  );

-- Trigger function for contacts INSERT / UPDATE / DELETE
CREATE OR REPLACE FUNCTION fn_update_campaign_stats_on_contact()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO campaign_stats (campaign_id, total_contacts, supporters, undecided, opponents, unknown, geocoded)
    VALUES (
      NEW.campaign_id,
      1,
      CASE WHEN NEW.status = 'supporter'  THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'undecided'  THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'opponent'   THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'unknown'    THEN 1 ELSE 0 END,
      CASE WHEN NEW.geo IS NOT NULL       THEN 1 ELSE 0 END
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
      total_contacts = campaign_stats.total_contacts + 1,
      supporters     = campaign_stats.supporters + CASE WHEN NEW.status = 'supporter' THEN 1 ELSE 0 END,
      undecided      = campaign_stats.undecided  + CASE WHEN NEW.status = 'undecided' THEN 1 ELSE 0 END,
      opponents      = campaign_stats.opponents  + CASE WHEN NEW.status = 'opponent'  THEN 1 ELSE 0 END,
      unknown        = campaign_stats.unknown    + CASE WHEN NEW.status = 'unknown'   THEN 1 ELSE 0 END,
      geocoded       = campaign_stats.geocoded   + CASE WHEN NEW.geo IS NOT NULL      THEN 1 ELSE 0 END,
      updated_at     = NOW();
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Only react to status or geo changes
    IF OLD.status IS DISTINCT FROM NEW.status OR (OLD.geo IS NULL) != (NEW.geo IS NULL) THEN
      UPDATE campaign_stats SET
        supporters = supporters
          - CASE WHEN OLD.status = 'supporter' THEN 1 ELSE 0 END
          + CASE WHEN NEW.status = 'supporter' THEN 1 ELSE 0 END,
        undecided = undecided
          - CASE WHEN OLD.status = 'undecided' THEN 1 ELSE 0 END
          + CASE WHEN NEW.status = 'undecided' THEN 1 ELSE 0 END,
        opponents = opponents
          - CASE WHEN OLD.status = 'opponent' THEN 1 ELSE 0 END
          + CASE WHEN NEW.status = 'opponent' THEN 1 ELSE 0 END,
        unknown = unknown
          - CASE WHEN OLD.status = 'unknown' THEN 1 ELSE 0 END
          + CASE WHEN NEW.status = 'unknown' THEN 1 ELSE 0 END,
        geocoded = geocoded
          - CASE WHEN OLD.geo IS NOT NULL THEN 1 ELSE 0 END
          + CASE WHEN NEW.geo IS NOT NULL THEN 1 ELSE 0 END,
        updated_at = NOW()
      WHERE campaign_id = NEW.campaign_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE campaign_stats SET
      total_contacts = GREATEST(0, total_contacts - 1),
      supporters     = GREATEST(0, supporters - CASE WHEN OLD.status = 'supporter' THEN 1 ELSE 0 END),
      undecided      = GREATEST(0, undecided  - CASE WHEN OLD.status = 'undecided' THEN 1 ELSE 0 END),
      opponents      = GREATEST(0, opponents  - CASE WHEN OLD.status = 'opponent'  THEN 1 ELSE 0 END),
      unknown        = GREATEST(0, unknown    - CASE WHEN OLD.status = 'unknown'   THEN 1 ELSE 0 END),
      geocoded       = GREATEST(0, geocoded   - CASE WHEN OLD.geo IS NOT NULL      THEN 1 ELSE 0 END),
      updated_at     = NOW()
    WHERE campaign_id = OLD.campaign_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_contacts_campaign_stats
  AFTER INSERT OR UPDATE OF status, geo OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_update_campaign_stats_on_contact();

-- Trigger function for canvass_visits INSERT / UPDATE / DELETE
CREATE OR REPLACE FUNCTION fn_update_campaign_stats_on_visit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO campaign_stats (campaign_id, total_visits, pending_visits)
    VALUES (
      NEW.campaign_id,
      1,
      CASE WHEN NEW.approved_at IS NULL THEN 1 ELSE 0 END
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
      total_visits   = campaign_stats.total_visits + 1,
      pending_visits = campaign_stats.pending_visits + CASE WHEN NEW.approved_at IS NULL THEN 1 ELSE 0 END,
      updated_at     = NOW();
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.approved_at IS NULL) != (NEW.approved_at IS NULL) THEN
      UPDATE campaign_stats SET
        pending_visits = pending_visits
          - CASE WHEN OLD.approved_at IS NULL THEN 1 ELSE 0 END
          + CASE WHEN NEW.approved_at IS NULL THEN 1 ELSE 0 END,
        updated_at = NOW()
      WHERE campaign_id = NEW.campaign_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE campaign_stats SET
      total_visits   = GREATEST(0, total_visits - 1),
      pending_visits = GREATEST(0, pending_visits - CASE WHEN OLD.approved_at IS NULL THEN 1 ELSE 0 END),
      updated_at     = NOW()
    WHERE campaign_id = OLD.campaign_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER trg_visits_campaign_stats
  AFTER INSERT OR UPDATE OF approved_at OR DELETE ON canvass_visits
  FOR EACH ROW EXECUTE FUNCTION fn_update_campaign_stats_on_visit();

-- Backfill existing data
INSERT INTO campaign_stats (campaign_id, total_contacts, supporters, undecided, opponents, unknown, geocoded)
SELECT
  campaign_id,
  COUNT(*),
  COUNT(*) FILTER (WHERE status = 'supporter'),
  COUNT(*) FILTER (WHERE status = 'undecided'),
  COUNT(*) FILTER (WHERE status = 'opponent'),
  COUNT(*) FILTER (WHERE status = 'unknown'),
  COUNT(*) FILTER (WHERE geo IS NOT NULL)
FROM contacts
GROUP BY campaign_id
ON CONFLICT (campaign_id) DO UPDATE SET
  total_contacts = EXCLUDED.total_contacts,
  supporters     = EXCLUDED.supporters,
  undecided      = EXCLUDED.undecided,
  opponents      = EXCLUDED.opponents,
  unknown        = EXCLUDED.unknown,
  geocoded       = EXCLUDED.geocoded,
  updated_at     = NOW();

-- Backfill visits counts
UPDATE campaign_stats cs SET
  total_visits = sub.tv,
  pending_visits = sub.pv
FROM (
  SELECT
    campaign_id,
    COUNT(*) as tv,
    COUNT(*) FILTER (WHERE approved_at IS NULL) as pv
  FROM canvass_visits
  GROUP BY campaign_id
) sub
WHERE cs.campaign_id = sub.campaign_id;

-- Also insert visit stats for campaigns that have visits but no contacts yet
INSERT INTO campaign_stats (campaign_id, total_visits, pending_visits)
SELECT
  campaign_id,
  COUNT(*),
  COUNT(*) FILTER (WHERE approved_at IS NULL)
FROM canvass_visits
WHERE campaign_id NOT IN (SELECT campaign_id FROM campaign_stats)
GROUP BY campaign_id
ON CONFLICT (campaign_id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Cursor pagination index
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_contacts_cursor
  ON contacts(campaign_id, created_at DESC, id);

-- ------------------------------------------------------------
-- 3. Trigram index for partial name search
-- ------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_contacts_trgm_name
  ON contacts USING GIN((first_name || ' ' || last_name) gin_trgm_ops);

-- ------------------------------------------------------------
-- 4. Unique indexes for import ON CONFLICT deduplication
-- ------------------------------------------------------------

-- campaign_id + document_number already exists as unique
-- Add unique indexes for email and phone per campaign
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_campaign_email
  ON contacts(campaign_id, email) WHERE email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_campaign_phone
  ON contacts(campaign_id, phone) WHERE phone IS NOT NULL;

-- ------------------------------------------------------------
-- 5. Composite indexes for future segment optimization
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_contacts_campaign_status
  ON contacts(campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_contacts_campaign_dept
  ON contacts(campaign_id, department) WHERE department IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_campaign_municipality
  ON contacts(campaign_id, municipality) WHERE municipality IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visits_contact_campaign
  ON canvass_visits(contact_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_contacts_campaign_lat_lng
  ON contacts(campaign_id, location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_visits_contact_created
  ON canvass_visits(contact_id, created_at DESC);

-- ------------------------------------------------------------
-- 6. RPC: Clustered contact points for map viewport
-- Uses arithmetic grid instead of ST_GeoHash for performance.
-- Keeps DECIMAL types in WHERE to enable index usage.
-- Only fetches visit result for single-point clusters (not aggregated ones).
-- ------------------------------------------------------------

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
  dominant_result TEXT
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
      MODE() WITHIN GROUP (ORDER BY gc.status)                AS dom_status
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
    cv.result::TEXT AS dominant_result
  FROM clustered cl
  LEFT JOIN LATERAL (
    SELECT result FROM canvass_visits
    WHERE contact_id = cl.single_id AND campaign_id = p_campaign_id
    ORDER BY created_at DESC LIMIT 1
  ) cv ON cl.single_id IS NOT NULL;
$$;
