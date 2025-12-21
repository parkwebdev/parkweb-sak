-- Add column to track if user has seen the onboarding celebration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_seen_onboarding_celebration boolean DEFAULT false;