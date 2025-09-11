-- Add missing client fields for CSV import
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS title text;

-- Update the client_name to be nullable since we'll have first_name and last_name
ALTER TABLE public.clients 
ALTER COLUMN client_name DROP NOT NULL;