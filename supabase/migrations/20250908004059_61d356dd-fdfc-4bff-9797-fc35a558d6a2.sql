-- Phase 1: Fix Critical Data Exposure Issues

-- Fix draft_submissions policies - remove public access by token
DROP POLICY IF EXISTS "Anyone can view non-expired drafts by token" ON public.draft_submissions;

-- Restrict email_templates access - remove public read access
DROP POLICY IF EXISTS "Everyone can view active email templates" ON public.email_templates;

-- Create secure email templates policy - only authenticated users can view
CREATE POLICY "Authenticated users can view active templates" ON public.email_templates
FOR SELECT 
TO authenticated
USING (active = true);

-- Add security logging table for Phase 3
CREATE TABLE IF NOT EXISTS public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT true,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Admins can view security logs" ON public.security_logs
FOR SELECT 
USING (is_admin(auth.uid()));

-- Allow system to insert security logs
CREATE POLICY "System can insert security logs" ON public.security_logs
FOR INSERT 
WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    success,
    details
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_success,
    p_details
  );
END;
$$;