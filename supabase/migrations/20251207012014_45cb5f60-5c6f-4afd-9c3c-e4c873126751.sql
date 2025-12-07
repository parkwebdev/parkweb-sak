-- Add CTA button columns to news_items table
ALTER TABLE public.news_items
ADD COLUMN cta_primary_label text,
ADD COLUMN cta_primary_url text,
ADD COLUMN cta_secondary_label text,
ADD COLUMN cta_secondary_url text;