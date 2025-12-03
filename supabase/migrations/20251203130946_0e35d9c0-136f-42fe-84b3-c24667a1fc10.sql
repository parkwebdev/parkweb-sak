-- Add icon column to help_categories table
ALTER TABLE public.help_categories 
ADD COLUMN icon text DEFAULT 'book';