-- Migration 011: Add email and phone to profiles
-- Needed for team member invitations via Supabase Auth admin API

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

COMMENT ON COLUMN profiles.email IS 'Email address — synced from auth.users on profile creation';
COMMENT ON COLUMN profiles.phone IS 'Phone number for field coordination';
