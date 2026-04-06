-- ============================================================
-- Stress Test: 500K contacts + 200K visits
-- Disables triggers during bulk insert for performance
-- ============================================================

-- Step 1: Disable triggers during bulk load
ALTER TABLE contacts DISABLE TRIGGER trg_contacts_campaign_stats;
ALTER TABLE canvass_visits DISABLE TRIGGER trg_visits_campaign_stats;
