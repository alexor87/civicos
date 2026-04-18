-- Expand search_vec to include all searchable contact fields
-- Previously only: first_name, last_name, email, phone, city, district
-- Now adds: document_number, address, department, municipality, commune, voting_place, voting_table, notes

ALTER TABLE contacts DROP COLUMN search_vec;

ALTER TABLE contacts ADD COLUMN search_vec TSVECTOR GENERATED ALWAYS AS (
  to_tsvector('spanish',
    COALESCE(first_name,'') || ' ' ||
    COALESCE(last_name,'') || ' ' ||
    COALESCE(email,'') || ' ' ||
    COALESCE(phone,'') || ' ' ||
    COALESCE(document_number,'') || ' ' ||
    COALESCE(address,'') || ' ' ||
    COALESCE(city,'') || ' ' ||
    COALESCE(district,'') || ' ' ||
    COALESCE(department,'') || ' ' ||
    COALESCE(municipality,'') || ' ' ||
    COALESCE(commune,'') || ' ' ||
    COALESCE(voting_place,'') || ' ' ||
    COALESCE(voting_table,'') || ' ' ||
    COALESCE(notes,'')
  )
) STORED;

-- GIN index rebuilds automatically on the new column
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vec);
