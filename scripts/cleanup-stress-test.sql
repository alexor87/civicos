-- ============================================================
-- Cleanup: Remove all stress test data
-- Run AFTER benchmarks are complete
-- ============================================================

DO $$
DECLARE
  v_campaign_id UUID := '37f9b055-d6de-465c-8369-196f4bc018af';
  v_deleted_visits BIGINT;
  v_deleted_contacts BIGINT;
BEGIN
  RAISE NOTICE 'Deleting stress test visits...';
  DELETE FROM canvass_visits
  WHERE campaign_id = v_campaign_id
    AND notes LIKE 'Stress test visit%';
  GET DIAGNOSTICS v_deleted_visits = ROW_COUNT;
  RAISE NOTICE 'Deleted % visits', v_deleted_visits;

  RAISE NOTICE 'Deleting stress test contacts...';
  DELETE FROM contacts
  WHERE campaign_id = v_campaign_id
    AND document_number LIKE 'STRESS_%';
  GET DIAGNOSTICS v_deleted_contacts = ROW_COUNT;
  RAISE NOTICE 'Deleted % contacts', v_deleted_contacts;

  -- Refresh campaign_stats after cleanup
  DELETE FROM campaign_stats WHERE campaign_id = v_campaign_id;

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
  WHERE campaign_id = v_campaign_id
  GROUP BY campaign_id;

  UPDATE campaign_stats cs SET
    total_visits = COALESCE(sub.tv, 0),
    pending_visits = COALESCE(sub.pv, 0)
  FROM (
    SELECT COUNT(*) as tv, COUNT(*) FILTER (WHERE approved_at IS NULL) as pv
    FROM canvass_visits WHERE campaign_id = v_campaign_id
  ) sub
  WHERE cs.campaign_id = v_campaign_id;

  RAISE NOTICE 'campaign_stats refreshed. Cleanup complete.';
END;
$$;
