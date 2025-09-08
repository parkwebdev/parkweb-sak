-- Fix security linter warning: Function Search Path Mutable
-- Update the validate_anonymous_submission function to have a secure search_path

CREATE OR REPLACE FUNCTION public.validate_anonymous_submission()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow anonymous submissions if user_id is the special anonymous UUID
  IF NEW.user_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    -- Validate required fields for anonymous submissions
    IF NEW.client_name IS NULL OR NEW.client_name = '' THEN
      RAISE EXCEPTION 'Client name is required for anonymous submissions';
    END IF;
    
    IF NEW.client_email IS NULL OR NEW.client_email = '' THEN
      RAISE EXCEPTION 'Client email is required for anonymous submissions';
    END IF;
    
    -- Basic email validation
    IF NEW.client_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format for anonymous submissions';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;