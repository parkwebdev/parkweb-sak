-- Secure help_categories table by removing public access
-- Drop the public SELECT policy that exposes user_id fields

DROP POLICY IF EXISTS "Public can view help categories" ON public.help_categories;

-- Add policy for authenticated users to view help categories
CREATE POLICY "Authenticated users can view help categories"
ON public.help_categories
FOR SELECT
TO authenticated
USING (true);