-- 1. Make the bucket public so thumbnails are accessible in the Help Center
UPDATE storage.buckets 
SET public = true 
WHERE id = 'Help Articles';

-- 2. Allow authenticated users to upload to Help Articles bucket
CREATE POLICY "Authenticated users can upload help article files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Help Articles');

-- 3. Allow authenticated users to update their files
CREATE POLICY "Authenticated users can update help article files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'Help Articles')
WITH CHECK (bucket_id = 'Help Articles');

-- 4. Allow authenticated users to delete their files
CREATE POLICY "Authenticated users can delete help article files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Help Articles');

-- 5. Allow public read access
CREATE POLICY "Public read access for help article files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Help Articles');