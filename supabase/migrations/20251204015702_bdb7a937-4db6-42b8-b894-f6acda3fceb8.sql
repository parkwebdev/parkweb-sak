-- Add storage policies with file type and size restrictions

-- Avatars bucket: Only allow image uploads, max 5MB
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp'))
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Article-images bucket: Only allow image uploads
DROP POLICY IF EXISTS "Users can upload article images" ON storage.objects;
CREATE POLICY "Users can upload article images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'article-images'
  AND auth.uid() IS NOT NULL
  AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp'))
);

DROP POLICY IF EXISTS "Users can update their article images" ON storage.objects;
CREATE POLICY "Users can update their article images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'article-images'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Users can delete their article images" ON storage.objects;
CREATE POLICY "Users can delete their article images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'article-images'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Article images are publicly accessible" ON storage.objects;
CREATE POLICY "Article images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'article-images');

-- Set bucket file size limits (5MB for avatars, 10MB for article images)
UPDATE storage.buckets 
SET file_size_limit = 5242880 
WHERE id = 'avatars';

UPDATE storage.buckets 
SET file_size_limit = 10485760 
WHERE id = 'article-images';