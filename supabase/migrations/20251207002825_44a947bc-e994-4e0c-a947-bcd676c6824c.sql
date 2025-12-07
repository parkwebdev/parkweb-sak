-- Add author_avatar column to news_items for displaying team member avatars
ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS author_avatar text;