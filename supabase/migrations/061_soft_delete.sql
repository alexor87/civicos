-- 061_soft_delete.sql
-- Borrado lógico de contactos: en lugar de eliminar filas, se marca deleted_at.

-- ── 1. Columna deleted_at ───────────────────────────────────────────────────

ALTER TABLE contacts
  ADD COLUMN deleted_at TIMESTAMPTZ;

-- ── 2. Índice parcial: queries normales filtran deleted_at IS NULL ───────────

CREATE INDEX idx_contacts_not_deleted
  ON contacts(campaign_id, created_at)
  WHERE deleted_at IS NULL;

-- ── 3. Actualizar campaign_stats al soft-delete ─────────────────────────────
-- El trigger existente ya maneja UPDATE de status/geo/contact_level.
-- Agregamos deleted_at al trigger para decrementar contadores al marcar borrado
-- y re-incrementar si se restaura (deleted_at vuelve a NULL).

CREATE OR REPLACE FUNCTION fn_update_campaign_stats_on_contact()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- No contar contactos que se insertan ya borrados (edge case)
    IF NEW.deleted_at IS NOT NULL THEN
      RETURN NEW;
    END IF;

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
    -- Soft delete: deleted_at cambió de NULL a valor → decrementar
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
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
      WHERE campaign_id = NEW.campaign_id;
      RETURN NEW;
    END IF;

    -- Restore: deleted_at cambió de valor a NULL → re-incrementar
    IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE campaign_stats SET
        total_contacts    = total_contacts + 1,
        supporters        = supporters + CASE WHEN NEW.status = 'supporter' THEN 1 ELSE 0 END,
        undecided         = undecided  + CASE WHEN NEW.status = 'undecided' THEN 1 ELSE 0 END,
        opponents         = opponents  + CASE WHEN NEW.status = 'opponent'  THEN 1 ELSE 0 END,
        unknown           = unknown    + CASE WHEN NEW.status = 'unknown'   THEN 1 ELSE 0 END,
        geocoded          = geocoded   + CASE WHEN NEW.geo IS NOT NULL      THEN 1 ELSE 0 END,
        contacts_completo = contacts_completo + CASE WHEN NEW.contact_level = 'completo' THEN 1 ELSE 0 END,
        contacts_opinion  = contacts_opinion  + CASE WHEN NEW.contact_level = 'opinion'  THEN 1 ELSE 0 END,
        contacts_anonimo  = contacts_anonimo  + CASE WHEN NEW.contact_level = 'anonimo'  THEN 1 ELSE 0 END,
        updated_at        = NOW()
      WHERE campaign_id = NEW.campaign_id;
      RETURN NEW;
    END IF;

    -- Normal update (no soft-delete change): solo si cambió status, geo o level
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL THEN
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
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Solo decrementar si no estaba soft-deleted
    IF OLD.deleted_at IS NULL THEN
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
    END IF;
    RETURN OLD;
  END IF;
END;
$$;

-- Re-crear trigger incluyendo deleted_at en la lista de columnas monitoreadas
DROP TRIGGER IF EXISTS trg_contacts_campaign_stats ON contacts;
CREATE TRIGGER trg_contacts_campaign_stats
  AFTER INSERT OR UPDATE OF status, geo, contact_level, deleted_at OR DELETE ON contacts
  FOR EACH ROW EXECUTE FUNCTION fn_update_campaign_stats_on_contact();
