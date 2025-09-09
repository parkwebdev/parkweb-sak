-- Create sample profiles for the demo users
INSERT INTO public.profiles (user_id, display_name, email) VALUES 
('cfdcde65-d8cc-45c3-8512-1155ceb041da', 'Aaron', 'aaron@example.com'),
('22222222-2222-2222-2222-222222222222', 'Jacob', 'jacob@example.com')
ON CONFLICT (user_id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email;

-- Update some requests to be assigned to Jacob for variety
UPDATE public.requests 
SET assigned_to = '22222222-2222-2222-2222-222222222222'::uuid
WHERE title ILIKE '%landing page%' OR title ILIKE '%ecommerce%';