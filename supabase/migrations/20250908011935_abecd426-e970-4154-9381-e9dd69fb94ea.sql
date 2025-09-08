-- Check if avatars bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- Ensure the bucket allows all file types
UPDATE storage.buckets 
SET file_size_limit = 5242880,  -- 5MB limit
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'avatars';