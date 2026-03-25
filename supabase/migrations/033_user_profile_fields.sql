-- Migration 033: User Profile fields for Phase 1 MVP
-- Extends existing profiles table with personal info, geographic, and preference fields

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_title TEXT,
  ADD COLUMN IF NOT EXISTS avatar_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS department_code TEXT,
  ADD COLUMN IF NOT EXISTS municipality_code TEXT,
  ADD COLUMN IF NOT EXISTS locality_name TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood_name TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es_CO',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Bogota',
  ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'normal';

-- Storage bucket for user avatars (separate from campaign-images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own avatar
CREATE POLICY "avatar_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can read avatars (public bucket)
CREATE POLICY "avatar_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Users can update their own avatar
CREATE POLICY "avatar_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own avatar
CREATE POLICY "avatar_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
