-- Deduplication index for contact import: unique per campaign + document_number
-- Partial (WHERE NOT NULL) so contacts without a document can still be inserted freely
CREATE UNIQUE INDEX IF NOT EXISTS contacts_campaign_document_unique
  ON contacts (campaign_id, document_number)
  WHERE document_number IS NOT NULL;
