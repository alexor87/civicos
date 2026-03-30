-- Add contact_id column to event_participants to link CRM contacts to events
ALTER TABLE event_participants ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id);
CREATE INDEX IF NOT EXISTS idx_event_participants_contact ON event_participants(contact_id);
