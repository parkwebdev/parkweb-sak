-- Allow public read access to email assets
CREATE POLICY "Anyone can view email assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'Email');