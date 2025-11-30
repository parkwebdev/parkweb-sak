-- Remove the restrictive deny policy that's causing confusion
-- The existing policies already explicitly require authentication (TO authenticated)
-- which means anonymous users have no access by default

DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

-- Verify that all SELECT policies are explicitly scoped to authenticated users
-- These policies already exist and are correctly scoped, this is just for clarity:
-- 1. "Users can view own profile" - TO authenticated
-- 2. "Admins can view all profiles" - TO authenticated
-- No policies exist for anon/public, so they have zero access by default