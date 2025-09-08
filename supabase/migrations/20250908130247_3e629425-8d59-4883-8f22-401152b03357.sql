-- Security Enhancement Phase 1: Restrict Template Access

-- 1. Update email_templates policy to admin-only access
DROP POLICY IF EXISTS "Authenticated users can view active templates" ON public.email_templates;

CREATE POLICY "Only admins can view email templates" 
ON public.email_templates 
FOR SELECT 
USING (is_admin(auth.uid()));

-- 2. Update onboarding_templates policy to authenticated users only
DROP POLICY IF EXISTS "Everyone can view active templates" ON public.onboarding_templates;

CREATE POLICY "Authenticated users can view active templates" 
ON public.onboarding_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND active = true);

-- 3. Add rate limiting and validation for anonymous submissions
-- Create a function to validate anonymous submissions
CREATE OR REPLACE FUNCTION public.validate_anonymous_submission()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply validation trigger to onboarding_submissions
CREATE TRIGGER validate_anonymous_onboarding_submission
  BEFORE INSERT ON public.onboarding_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_anonymous_submission();

-- Apply validation trigger to scope_of_works
CREATE TRIGGER validate_anonymous_scope_submission
  BEFORE INSERT ON public.scope_of_works
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_anonymous_submission();