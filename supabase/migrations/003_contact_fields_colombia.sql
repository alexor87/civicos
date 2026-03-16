-- Migration 003: Colombian electoral CRM fields
-- Adds document identity, electoral location, and political profile columns

ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS document_type   TEXT,
  ADD COLUMN IF NOT EXISTS document_number TEXT,
  ADD COLUMN IF NOT EXISTS birth_date      DATE,
  ADD COLUMN IF NOT EXISTS gender          TEXT,
  ADD COLUMN IF NOT EXISTS department      TEXT,
  ADD COLUMN IF NOT EXISTS municipality    TEXT,
  ADD COLUMN IF NOT EXISTS commune         TEXT,
  ADD COLUMN IF NOT EXISTS voting_place    TEXT,
  ADD COLUMN IF NOT EXISTS voting_table    TEXT;

-- Unique document number per campaign (primary deduplication key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_doc_campaign
  ON contacts(campaign_id, document_number)
  WHERE document_number IS NOT NULL;

-- Index for department-level territorial queries
CREATE INDEX IF NOT EXISTS idx_contacts_department
  ON contacts(department)
  WHERE department IS NOT NULL;
