-- Create storage bucket for conversation file attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('conversation-files', 'conversation-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to conversation-files bucket
CREATE POLICY "Authenticated users can upload conversation files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'conversation-files');

-- Allow public read access to conversation files
CREATE POLICY "Public can view conversation files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'conversation-files');

-- Allow authenticated users to delete their own conversation files
CREATE POLICY "Authenticated users can delete conversation files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'conversation-files');