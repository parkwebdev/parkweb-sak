-- Add file columns to scope_of_works table
ALTER TABLE public.scope_of_works 
ADD COLUMN branding_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN content_files jsonb DEFAULT '[]'::jsonb;