-- Add policy to allow public/anonymous uploads to conversation-files bucket
CREATE POLICY "Anyone can upload conversation files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'conversation-files');