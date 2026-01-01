-- Add company information columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN company_name text,
ADD COLUMN company_address text,
ADD COLUMN company_phone text;