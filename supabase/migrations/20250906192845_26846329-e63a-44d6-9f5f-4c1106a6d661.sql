-- Remove the incorrect Jacob entry and keep the correct one
DELETE FROM public.profiles WHERE email = 'jacob@supabase.com' AND display_name IS NULL;