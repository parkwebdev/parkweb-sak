-- Create bucket for article images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- RLS policy: Authenticated users can upload article images
CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'article-images');

-- RLS policy: Anyone can view article images (public bucket)
CREATE POLICY "Anyone can view article images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'article-images');

-- RLS policy: Users can delete their own article images (organized by user_id folder)
CREATE POLICY "Users can delete their own article images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'article-images' AND auth.uid()::text = (storage.foldername(name))[1]);