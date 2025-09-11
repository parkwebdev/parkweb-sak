-- Make company_name nullable in clients table to fix CSV import
ALTER TABLE public.clients 
ALTER COLUMN company_name DROP NOT NULL;

-- Remove Aaron Chachamovits from clients table (but keep the user account)
DELETE FROM public.clients 
WHERE email = 'aaronchachamovits@gmail.com' OR client_name ILIKE '%aaron%chachamovits%';