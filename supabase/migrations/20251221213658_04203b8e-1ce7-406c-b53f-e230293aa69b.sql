-- Add setup feedback columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS setup_rating integer,
ADD COLUMN IF NOT EXISTS setup_feedback_text text;

-- Add constraint to ensure rating is between 1 and 5
ALTER TABLE public.profiles
ADD CONSTRAINT setup_rating_range CHECK (setup_rating IS NULL OR (setup_rating >= 1 AND setup_rating <= 5));