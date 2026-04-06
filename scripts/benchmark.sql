-- ============================================================
-- Benchmark: Measure performance of each optimization
-- Run AFTER stress-test.sql has populated 500K contacts
-- ============================================================

\timing on

DO $$ BEGIN RAISE NOTICE '══════════════════════════════════════════════════════'; END $$;
DO $$ BEGIN RAISE NOTICE 'BENCHMARK START — 500K contacts + 200K visits'; END $$;
DO $$ BEGIN RAISE NOTICE '══════════════════════════════════════════════════════'; END $$;

-- ── 1. campaign_stats O(1) read vs COUNT(*) ─────────────────────

DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '── TEST 1: Dashboard KPIs ──'; END $$;

DO $$ BEGIN RAISE NOTICE '1a. OLD WAY — 4x COUNT(*) queries:'; END $$;

SELECT COUNT(*) AS total_contacts
FROM contacts WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af';

SELECT COUNT(*) AS supporters
FROM contacts WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af' AND status = 'supporter';

SELECT COUNT(*) AS total_visits
FROM canvass_visits WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af';

SELECT COUNT(*) AS pending_visits
FROM canvass_visits WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af' AND approved_at IS NULL;

DO $$ BEGIN RAISE NOTICE '1b. NEW WAY — Single campaign_stats read:'; END $$;

SELECT total_contacts, supporters, total_visits, pending_visits
FROM campaign_stats WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af';

-- ── 2. Cursor pagination vs OFFSET ──────────────────────────────

DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '── TEST 2: Pagination ──'; END $$;

DO $$ BEGIN RAISE NOTICE '2a. OLD WAY — OFFSET 400000 (page 8001 of 50/page):'; END $$;

SELECT id, first_name, last_name, status, created_at
FROM contacts
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
ORDER BY created_at DESC
LIMIT 50 OFFSET 400000;

DO $$ BEGIN RAISE NOTICE '2b. NEW WAY — Cursor-based (any position, same speed):'; END $$;

-- First get a cursor value from somewhere deep in the dataset
WITH cursor_val AS (
  SELECT created_at FROM contacts
  WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
  ORDER BY created_at DESC
  LIMIT 1 OFFSET 400000
)
SELECT id, first_name, last_name, status, created_at
FROM contacts
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
  AND created_at < (SELECT created_at FROM cursor_val)
ORDER BY created_at DESC
LIMIT 50;

-- ── 3. Full-text search vs ILIKE ────────────────────────────────

DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '── TEST 3: Search ──'; END $$;

DO $$ BEGIN RAISE NOTICE '3a. OLD WAY — ILIKE wildcard:'; END $$;

SELECT id, first_name, last_name
FROM contacts
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
  AND (first_name ILIKE '%Carlos%' OR last_name ILIKE '%García%' OR email ILIKE '%Carlos%' OR phone ILIKE '%Carlos%')
LIMIT 50;

DO $$ BEGIN RAISE NOTICE '3b. NEW WAY — Full-text search (search_vec):'; END $$;

SELECT id, first_name, last_name
FROM contacts
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
  AND search_vec @@ websearch_to_tsquery('spanish', 'Carlos García')
LIMIT 50;

DO $$ BEGIN RAISE NOTICE '3c. NEW WAY — Trigram partial match:'; END $$;

SELECT id, first_name, last_name
FROM contacts
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
  AND (first_name || ' ' || last_name) % 'Carlos Garc'
LIMIT 50;

-- ── 4. Map clustering RPC ───────────────────────────────────────

DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '── TEST 4: Map Clustering ──'; END $$;

DO $$ BEGIN RAISE NOTICE '4a. OLD WAY — Load ALL geo contacts:'; END $$;

SELECT id, location_lat, location_lng, status
FROM contacts
WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af'
  AND location_lat IS NOT NULL
  AND location_lng IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '4b. NEW WAY — Clustered RPC (zoom 10, wide view):'; END $$;

SELECT * FROM get_clustered_contacts(
  '37f9b055-d6de-465c-8369-196f4bc018af',
  5.9, -75.7, 6.4, -75.1,
  10
);

DO $$ BEGIN RAISE NOTICE '4c. NEW WAY — Clustered RPC (zoom 15, neighborhood):'; END $$;

SELECT * FROM get_clustered_contacts(
  '37f9b055-d6de-465c-8369-196f4bc018af',
  6.1, -75.5, 6.2, -75.4,
  15
);

DO $$ BEGIN RAISE NOTICE '4d. NEW WAY — Clustered RPC (zoom 18, street level):'; END $$;

SELECT * FROM get_clustered_contacts(
  '37f9b055-d6de-465c-8369-196f4bc018af',
  6.14, -75.46, 6.16, -75.44,
  18
);

-- ── 5. campaign_stats accuracy check ────────────────────────────

DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '── TEST 5: Stats Accuracy ──'; END $$;

SELECT
  cs.total_contacts AS stats_total,
  (SELECT COUNT(*) FROM contacts WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af') AS real_total,
  cs.supporters AS stats_supporters,
  (SELECT COUNT(*) FROM contacts WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af' AND status = 'supporter') AS real_supporters,
  cs.total_visits AS stats_visits,
  (SELECT COUNT(*) FROM canvass_visits WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af') AS real_visits,
  cs.pending_visits AS stats_pending,
  (SELECT COUNT(*) FROM canvass_visits WHERE campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af' AND approved_at IS NULL) AS real_pending
FROM campaign_stats cs
WHERE cs.campaign_id = '37f9b055-d6de-465c-8369-196f4bc018af';

DO $$ BEGIN RAISE NOTICE '══════════════════════════════════════════════════════'; END $$;
DO $$ BEGIN RAISE NOTICE 'BENCHMARK COMPLETE'; END $$;
DO $$ BEGIN RAISE NOTICE '══════════════════════════════════════════════════════'; END $$;

\timing off
