-- Deduplication index for contact import: unique per campaign + document_number
-- Full (non-partial) so ON CONFLICT (campaign_id, document_number) works in all cases.
-- PostgreSQL allows multiple NULLs in a unique index, so contacts without a document
-- can still be inserted freely.
DROP INDEX IF EXISTS contacts_campaign_document_unique;
CREATE UNIQUE INDEX contacts_campaign_document_unique
  ON contacts (campaign_id, document_number);
