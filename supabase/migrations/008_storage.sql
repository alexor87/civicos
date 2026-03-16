-- ── Campaign Images Storage ──────────────────────────────────────────────────
-- Public bucket for email campaign hero images (max 5 MB, images only)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaign-images',
  'campaign-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder (user_id/filename)
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaign-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can read public campaign images
CREATE POLICY "Campaign images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign-images');

-- Users can delete their own images
CREATE POLICY "Users can delete their own campaign images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaign-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
