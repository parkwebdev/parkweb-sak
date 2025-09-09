-- Update some requests to be assigned to Jacob instead of all to Aaron
-- Get Jacob's user_id first (the second profile we created)
UPDATE public.requests 
SET assigned_to = (
  SELECT user_id FROM public.profiles 
  WHERE display_name = 'Jacob' 
  LIMIT 1
)
WHERE id IN (
  SELECT id FROM public.requests 
  WHERE assigned_to IS NOT NULL 
  ORDER BY created_at 
  LIMIT 2
);