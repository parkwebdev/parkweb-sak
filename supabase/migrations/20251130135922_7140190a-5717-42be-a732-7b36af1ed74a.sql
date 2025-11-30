-- Secure announcements table by removing public access
-- Drop the public SELECT policy that exposes user_id fields

DROP POLICY IF EXISTS "Public can view active announcements" ON public.announcements;

-- Announcements will now only be viewable by authenticated users who own them
-- This prevents attackers from mapping user_id to agents and identifying customers