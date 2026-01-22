-- Add signup_completed_at column to profiles table
-- This prevents duplicate welcome emails by tracking when signup was fully processed

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signup_completed_at timestamptz;