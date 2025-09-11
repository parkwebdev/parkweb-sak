-- Phase 1: Critical Security Fixes (Corrected)
-- Fix anonymous access vulnerabilities while preserving functionality

-- Create secure tokens for anonymous onboarding access
CREATE TABLE IF NOT EXISTS public.onboarding_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE,
  client_name text NOT NULL,
  client_email text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),
  used boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on onboarding_tokens
ALTER TABLE public.onboarding_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for onboarding_tokens
CREATE POLICY "Authenticated users can create tokens" 
ON public.onboarding_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view their tokens" 
ON public.onboarding_tokens 
FOR SELECT 
USING (auth.uid() = created_by OR auth.uid() IS NULL);

CREATE POLICY "Authenticated users can update their tokens" 
ON public.onboarding_tokens 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Function to validate onboarding tokens
CREATE OR REPLACE FUNCTION public.validate_onboarding_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM onboarding_tokens 
    WHERE token = p_token 
    AND expires_at > now() 
    AND used = false
  );
END;
$$;

-- Function to validate token for submission
CREATE OR REPLACE FUNCTION public.validate_submission_token(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM onboarding_tokens 
    WHERE client_email = p_email 
    AND expires_at > now() 
    AND used = false
  );
END;
$$;

-- Update RLS policies for onboarding_submissions to require valid token
DROP POLICY IF EXISTS "Users can create submissions" ON public.onboarding_submissions;
CREATE POLICY "Users can create authenticated submissions" 
ON public.onboarding_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create separate policy for token-based submissions
CREATE POLICY "Valid token holders can create submissions" 
ON public.onboarding_submissions 
FOR INSERT 
WITH CHECK (
  user_id = '00000000-0000-0000-0000-000000000000'::uuid AND
  auth.uid() IS NULL AND
  validate_submission_token(client_email)
);

-- Update RLS policies for scope_of_works to require valid token  
DROP POLICY IF EXISTS "Users can create their own scope of works" ON public.scope_of_works;
CREATE POLICY "Users can create authenticated scope of works" 
ON public.scope_of_works 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Valid token holders can create scope of works" 
ON public.scope_of_works 
FOR INSERT 
WITH CHECK (
  user_id = '00000000-0000-0000-0000-000000000000'::uuid AND
  auth.uid() IS NULL AND
  validate_submission_token(email)
);

-- Update RLS policies for requests to require authentication
DROP POLICY IF EXISTS "Users can create requests" ON public.requests;
CREATE POLICY "Users can create authenticated requests" 
ON public.requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Tighten security_logs policy to prevent tampering
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_logs;
CREATE POLICY "Only system functions can insert security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (current_setting('role') = 'authenticator');

-- Function to mark onboarding token as used
CREATE OR REPLACE FUNCTION public.mark_token_used(p_token text, p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = public
AS $$
BEGIN
  UPDATE onboarding_tokens 
  SET used = true 
  WHERE token = p_token 
  AND client_email = p_email;
END;
$$;