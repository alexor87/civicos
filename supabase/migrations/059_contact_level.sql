-- 059_contact_level.sql
-- Feature: Voto de Opinión — 3 niveles de contacto (completo, opinion, anonimo)
-- Permite registrar contactos sin datos completos para contar votos potenciales.

-- ── 1. Enum type ────────────────────────────────────────────────────────────

CREATE TYPE contact_level AS ENUM ('completo', 'opinion', 'anonimo');

-- ── 2. New columns on contacts ──────────────────────────────────────────────

ALTER TABLE contacts
  ADD COLUMN contact_level contact_level NOT NULL DEFAULT 'completo';

ALTER TABLE contacts
  ADD COLUMN anon_number INTEGER;

-- ── 3. Counter on campaigns for anonymous sequential naming ─────────────────

ALTER TABLE campaigns
  ADD COLUMN anon_seq INTEGER NOT NULL DEFAULT 0;

-- ── 4. Make first_name / last_name nullable (for anonimo contacts) ──────────

ALTER TABLE contacts
  ALTER COLUMN first_name DROP NOT NULL;

ALTER TABLE contacts
  ALTER COLUMN last_name DROP NOT NULL;

-- ── 5. CHECK constraints ────────────────────────────────────────────────────

-- completo and opinion contacts MUST have names
ALTER TABLE contacts
  ADD CONSTRAINT chk_contact_level_names CHECK (
    CASE
      WHEN contact_level IN ('completo', 'opinion')
        THEN first_name IS NOT NULL AND last_name IS NOT NULL
      ELSE TRUE
    END
  );

-- anonimo contacts MUST have anon_number
ALTER TABLE contacts
  ADD CONSTRAINT chk_anonimo_number CHECK (
    CASE
      WHEN contact_level = 'anonimo'
        THEN anon_number IS NOT NULL
      ELSE TRUE
    END
  );

-- ── 6. Generated display_name column ────────────────────────────────────────

ALTER TABLE contacts
  ADD COLUMN display_name TEXT GENERATED ALWAYS AS (
    CASE
      WHEN first_name IS NOT NULL AND last_name IS NOT NULL
        THEN first_name || ' ' || last_name
      WHEN first_name IS NOT NULL
        THEN first_name
      ELSE 'Anónimo #' || COALESCE(anon_number::TEXT, '?')
    END
  ) STORED;

-- ── 7. Trigger: auto-assign anon_number on INSERT ──────────────────────────

CREATE OR REPLACE FUNCTION fn_assign_anon_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_next_seq INTEGER;
BEGIN
  IF NEW.contact_level = 'anonimo' AND NEW.anon_number IS NULL THEN
    UPDATE campaigns
      SET anon_seq = anon_seq + 1
      WHERE id = NEW.campaign_id
      RETURNING anon_seq INTO v_next_seq;
    NEW.anon_number := v_next_seq;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_anon_number
  BEFORE INSERT ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_assign_anon_number();

-- ── 8. Trigger: prevent level downgrade ─────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_prevent_level_downgrade()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.contact_level IS DISTINCT FROM NEW.contact_level THEN
    -- Allowed: anonimo→opinion, anonimo→completo, opinion→completo
    IF OLD.contact_level = 'completo' THEN
      RAISE EXCEPTION 'Cannot downgrade from completo';
    END IF;
    IF OLD.contact_level = 'opinion' AND NEW.contact_level = 'anonimo' THEN
      RAISE EXCEPTION 'Cannot downgrade from opinion to anonimo';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_level_downgrade
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_level_downgrade();

-- ── 9. Indexes ──────────────────────────────────────────────────────────────

-- Fast filtering by level within a campaign
CREATE INDEX idx_contacts_campaign_level
  ON contacts(campaign_id, contact_level);

-- Dedup for opinion contacts: same name within same campaign
CREATE UNIQUE INDEX idx_contacts_opinion_name_dedup
  ON contacts(campaign_id, lower(first_name), lower(last_name))
  WHERE contact_level = 'opinion'
    AND first_name IS NOT NULL
    AND last_name IS NOT NULL;

-- Fix trigram index to handle NULL names (was: first_name || ' ' || last_name)
DROP INDEX IF EXISTS idx_contacts_trgm_name;
CREATE INDEX idx_contacts_trgm_name
  ON contacts USING GIN (
    (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) gin_trgm_ops
  );

-- ── 10. campaign_stats: level counters ──────────────────────────────────────

ALTER TABLE campaign_stats
  ADD COLUMN contacts_completo BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN contacts_opinion  BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN contacts_anonimo  BIGINT NOT NULL DEFAULT 0;

-- Backfill: all existing contacts are completo
UPDATE campaign_stats SET contacts_completo = total_contacts;

-- ── 11. Update campaign_stats trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_update_campaign_stats_on_contact()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO campaign_stats (
      campaign_id, total_contacts,
      supporters, undecided, opponents, unknown, geocoded,
      contacts_completo, contacts_opinion, contacts_anonimo
    ) VALUES (
      NEW.campaign_id, 1,
      CASE WHEN NEW.status = 'supporter'  THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'undecided'  THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'opponent'   THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'unknown'    THEN 1 ELSE 0 END,
      CASE WHEN NEW.geo IS NOT NULL       THEN 1 ELSE 0 END,
      CASE WHEN NEW.contact_level = 'completo' THEN 1 ELSE 0 END,
      CASE WHEN NEW.contact_level = 'opinion'  THEN 1 ELSE 0 END,
      CASE WHEN NEW.contact_level = 'anonimo'  THEN 1 ELSE 0 END
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
      total_contacts    = campaign_stats.total_contacts + 1,
      supporters        = campaign_stats.supporters + CASE WHEN NEW.status = 'supporter' THEN 1 ELSE 0 END,
      undecided         = campaign_stats.undecided  + CASE WHEN NEW.status = 'undecided' THEN 1 ELSE 0 END,
      opponents         = campaign_stats.opponents  + CASE WHEN NEW.status = 'opponent'  THEN 1 ELSE 0 END,
      unknown           = campaign_stats.unknown    + CASE WHEN NEW.status = 'unknown'   THEN 1 ELSE 0 END,
      geocoded          = campaign_stats.geocoded   + CASE WHEN NEW.geo IS NOT NULL      THEN 1 ELSE 0 END,
      contacts_completo = campaign_stats.contacts_completo + CASE WHEN NEW.contact_level = 'completo' THEN 1 ELSE 0 END,
      contacts_opinion  = campaign_stats.contacts_opinion  + CASE WHEN NEW.contact_level = 'opinion'  THEN 1 ELSE 0 END,
      contacts_anonimo  = campaign_stats.contacts_anonimo  + CASE WHEN NEW.contact_level = 'anonimo'  THEN 1 ELSE 0 END,
      updated_at        = NOW();
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status
       OR (OLD.geo IS NULL) != (NEW.geo IS NULL)
       OR OLD.contact_level IS DISTINCT FROM NEW.contact_level THEN
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
        contacts_completo = contacts_completo
          - CASE WHEN OLD.contact_level = 'completo' THEN 1 ELSE 0 END
          + CASE WHEN NEW.contact_level = 'completo' THEN 1 ELSE 0 END,
        contacts_opinion = contacts_opinion
          - CASE WHEN OLD.contact_level = 'opinion' THEN 1 ELSE 0 END
          + CASE WHEN NEW.contact_level = 'opinion' THEN 1 ELSE 0 END,
        contacts_anonimo = contacts_anonimo
          - CASE WHEN OLD.contact_level = 'anonimo' THEN 1 ELSE 0 END
          + CASE WHEN NEW.contact_level = 'anonimo' THEN 1 ELSE 0 END,
        updated_at = NOW()
      WHERE campaign_id = NEW.campaign_id;
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE campaign_stats SET
      total_contacts    = GREATEST(0, total_contacts - 1),
      supporters        = GREATEST(0, supporters - CASE WHEN OLD.status = 'supporter' THEN 1 ELSE 0 END),
      undecided         = GREATEST(0, undecided  - CASE WHEN OLD.status = 'undecided' THEN 1 ELSE 0 END),
      opponents         = GREATEST(0, opponents  - CASE WHEN OLD.status = 'opponent'  THEN 1 ELSE 0 END),
      unknown           = GREATEST(0, unknown    - CASE WHEN OLD.status = 'unknown'   THEN 1 ELSE 0 END),
      geocoded          = GREATEST(0, geocoded   - CASE WHEN OLD.geo IS NOT NULL      THEN 1 ELSE 0 END),
      contacts_completo = GREATEST(0, contacts_completo - CASE WHEN OLD.contact_level = 'completo' THEN 1 ELSE 0 END),
      contacts_opinion  = GREATEST(0, contacts_opinion  - CASE WHEN OLD.contact_level = 'opinion'  THEN 1 ELSE 0 END),
      contacts_anonimo  = GREATEST(0, contacts_anonimo  - CASE WHEN OLD.contact_level = 'anonimo'  THEN 1 ELSE 0 END),
      updated_at        = NOW()
    WHERE campaign_id = OLD.campaign_id;
    RETURN OLD;
  END IF;
END;
$$;

-- Re-create trigger to also fire on contact_level changes
DROP TRIGGER IF EXISTS trg_contacts_campaign_stats ON contacts;
CREATE TRIGGER trg_contacts_campaign_stats
  AFTER INSERT OR UPDATE OF status, geo, contact_level OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_update_campaign_stats_on_contact();
