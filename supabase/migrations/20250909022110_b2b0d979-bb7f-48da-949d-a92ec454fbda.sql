-- First, let's update some requests to be assigned to different team members
-- We'll get the actual user_ids from the profiles table
DO $$ 
DECLARE
    aaron_id uuid;
    jacob_id uuid;
BEGIN
    -- Get the user_ids from profiles
    SELECT user_id INTO aaron_id FROM public.profiles WHERE display_name = 'Aaron' LIMIT 1;
    SELECT user_id INTO jacob_id FROM public.profiles WHERE display_name = 'Jacob' LIMIT 1;
    
    -- Update first 2 requests to be assigned to Jacob
    UPDATE public.requests 
    SET assigned_to = jacob_id
    WHERE id IN (
        SELECT id FROM public.requests 
        WHERE assigned_to IS NOT NULL 
        ORDER BY created_at 
        LIMIT 2
    );
    
    -- Update next 2 requests to be assigned to Aaron  
    UPDATE public.requests 
    SET assigned_to = aaron_id
    WHERE id IN (
        SELECT id FROM public.requests 
        WHERE assigned_to IS NOT NULL 
        AND assigned_to != jacob_id
        ORDER BY created_at 
        LIMIT 2
    );
END $$;