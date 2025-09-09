-- Fix foreign key constraint and update request assignments
-- First drop the old foreign key constraint and create correct one
ALTER TABLE public.requests 
DROP CONSTRAINT IF EXISTS requests_assigned_to_fkey;

-- Create the correct foreign key constraint to profiles.user_id
ALTER TABLE public.requests 
ADD CONSTRAINT requests_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES public.profiles(user_id) 
ON DELETE SET NULL;

-- Now update some requests to be assigned to different team members
DO $$ 
DECLARE
    aaron_id uuid;
    jacob_id uuid;
    request_ids uuid[];
BEGIN
    -- Get the user_ids from profiles
    SELECT user_id INTO aaron_id FROM public.profiles WHERE display_name = 'Aaron' LIMIT 1;
    SELECT user_id INTO jacob_id FROM public.profiles WHERE display_name = 'Jacob' LIMIT 1;
    
    -- Get all assigned request IDs
    SELECT ARRAY(SELECT id FROM public.requests WHERE assigned_to IS NOT NULL ORDER BY created_at) INTO request_ids;
    
    -- Assign first half to Jacob, second half to Aaron
    IF array_length(request_ids, 1) > 0 THEN
        -- Assign first half to Jacob
        UPDATE public.requests 
        SET assigned_to = jacob_id
        WHERE id = ANY(request_ids[1:(array_length(request_ids, 1)/2)]);
        
        -- Assign second half to Aaron  
        UPDATE public.requests 
        SET assigned_to = aaron_id
        WHERE id = ANY(request_ids[(array_length(request_ids, 1)/2 + 1):array_length(request_ids, 1)]);
    END IF;
END $$;