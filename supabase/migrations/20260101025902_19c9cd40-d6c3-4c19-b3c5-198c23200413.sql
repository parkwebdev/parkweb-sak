-- Admin-only write access for Email bucket assets
-- Note: bucket is public for reads; these policies restrict uploads/edits/deletes to admins.

CREATE POLICY "Admins can upload email assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Email'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update email assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Email'
  AND public.is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'Email'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete email assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Email'
  AND public.is_admin(auth.uid())
);