-- 062_fix_unique_indexes_soft_delete.sql
-- Fix unique indexes to exclude soft-deleted contacts and scope email/phone
-- dedup to completo-level only (opinion contacts may share phone/email).

-- ── 0. Fix existing duplicate data ───────────────────────────────────────────
-- There are 2 completo contacts with the same document_number and phone.
-- Soft-delete the older duplicate (trailing space in first_name).
UPDATE contacts SET deleted_at = NOW()
  WHERE id = 'de42d2b4-1399-42ba-b2d8-1aa38bc8c874'
    AND deleted_at IS NULL;

-- ── 1. Drop old indexes ──────────────────────────────────────────────────────
DROP INDEX IF EXISTS contacts_campaign_document_unique;
DROP INDEX IF EXISTS idx_contacts_doc_campaign;
DROP INDEX IF EXISTS idx_contacts_campaign_email;
DROP INDEX IF EXISTS idx_contacts_campaign_phone;
DROP INDEX IF EXISTS idx_contacts_opinion_name_dedup;

-- ── 2. Recreate with deleted_at IS NULL filter ───────────────────────────────

-- Document unique: only for non-deleted contacts with document_number
CREATE UNIQUE INDEX idx_contacts_doc_campaign
  ON contacts(campaign_id, document_number)
  WHERE document_number IS NOT NULL AND deleted_at IS NULL;

-- Email unique: only for completo non-deleted contacts
CREATE UNIQUE INDEX idx_contacts_campaign_email
  ON contacts(campaign_id, email)
  WHERE email IS NOT NULL AND deleted_at IS NULL AND contact_level = 'completo';

-- Phone unique: only for completo non-deleted contacts
CREATE UNIQUE INDEX idx_contacts_campaign_phone
  ON contacts(campaign_id, phone)
  WHERE phone IS NOT NULL AND deleted_at IS NULL AND contact_level = 'completo';

-- Opinion name dedup: only for non-deleted opinion contacts
CREATE UNIQUE INDEX idx_contacts_opinion_name_dedup
  ON contacts(campaign_id, lower(first_name), lower(last_name))
  WHERE contact_level = 'opinion'
    AND first_name IS NOT NULL
    AND last_name IS NOT NULL
    AND deleted_at IS NULL;
