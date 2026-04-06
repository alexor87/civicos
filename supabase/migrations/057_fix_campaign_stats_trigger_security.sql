-- Trigger functions that write to campaign_stats must run as the function owner
-- (SECURITY DEFINER) so RLS on campaign_stats does not block them.
-- The table only has a SELECT policy; without SECURITY DEFINER the trigger fires
-- in the calling user's context and the INSERT/UPDATE is rejected by RLS.

CREATE OR REPLACE FUNCTION fn_update_campaign_stats_on_contact()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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

CREATE OR REPLACE FUNCTION fn_update_campaign_stats_on_visit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
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
