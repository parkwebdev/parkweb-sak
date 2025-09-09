-- Add foreign key relationship between requests.assigned_to and profiles.user_id
-- This will help with proper joins and data integrity
ALTER TABLE public.requests 
ADD CONSTRAINT fk_requests_assigned_to_profiles 
FOREIGN KEY (assigned_to) 
REFERENCES public.profiles(user_id) 
ON DELETE SET NULL;