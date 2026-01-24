-- Add description column to plans table
ALTER TABLE public.plans 
ADD COLUMN description TEXT;

COMMENT ON COLUMN public.plans.description IS 'Short marketing description shown below plan title on pricing cards';