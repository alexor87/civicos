-- Add slogan column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS slogan TEXT;
