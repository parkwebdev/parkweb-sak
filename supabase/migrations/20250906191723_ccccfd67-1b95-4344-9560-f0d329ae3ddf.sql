-- Add Jacob Holley from Supabase as a team member
INSERT INTO public.profiles (user_id, display_name, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Jacob Holley',
  'jacob@supabase.com',
  now(),
  now()
);