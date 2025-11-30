-- Create security_logs table for security event tracking
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  success BOOLEAN DEFAULT true,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON public.security_logs(action);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Admin users can view all security logs
CREATE POLICY "Admins can view all security logs"
  ON public.security_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can view their own security logs
CREATE POLICY "Users can view their own security logs"
  ON public.security_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create email_templates table for team invitations and notifications
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default team invitation template
INSERT INTO public.email_templates (name, subject, html_content, text_content) VALUES
(
  'team_invitation',
  '{{invited_by}} invited you to join {{company_name}} on ChatPad',
  '<html><body><h1>You''ve been invited!</h1><p>{{invited_by}} has invited you to join {{company_name}} on ChatPad.</p><p><a href="{{signup_url}}">Accept Invitation</a></p></body></html>',
  'You''ve been invited!

{{invited_by}} has invited you to join {{company_name}} on ChatPad.

Accept your invitation here: {{signup_url}}'
) ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read active templates (needed for edge functions)
CREATE POLICY "Anyone can read active email templates"
  ON public.email_templates
  FOR SELECT
  USING (active = true);

-- Only super admins can manage templates
CREATE POLICY "Super admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- Create pending_invitations table for tracking team invitations
CREATE TABLE IF NOT EXISTS public.pending_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by_name TEXT NOT NULL,
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_invitations_email ON public.pending_invitations(email);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_invited_by ON public.pending_invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_pending_invitations_status ON public.pending_invitations(status);

-- Enable RLS
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Inviters can view their own invitations
CREATE POLICY "Users can view their sent invitations"
  ON public.pending_invitations
  FOR SELECT
  USING (auth.uid() = invited_by);

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
  ON public.pending_invitations
  FOR SELECT
  USING (is_admin(auth.uid()));

-- System can insert invitations (via edge function)
CREATE POLICY "System can insert invitations"
  ON public.pending_invitations
  FOR INSERT
  WITH CHECK (true);

-- System can update invitations (via edge function)
CREATE POLICY "System can update invitations"
  ON public.pending_invitations
  FOR UPDATE
  USING (true);

-- Standardize plans table with consistent limit fields
UPDATE public.plans
SET limits = jsonb_build_object(
  'max_agents', 1,
  'max_api_calls_per_month', 10000,
  'max_conversations_per_month', 1000,
  'max_knowledge_sources', 5,
  'max_team_members', 1,
  'max_webhooks', 3
)
WHERE name = 'Starter';

UPDATE public.plans
SET limits = jsonb_build_object(
  'max_agents', 5,
  'max_api_calls_per_month', 50000,
  'max_conversations_per_month', 10000,
  'max_knowledge_sources', 25,
  'max_team_members', 5,
  'max_webhooks', 10
)
WHERE name = 'Professional';

UPDATE public.plans
SET limits = jsonb_build_object(
  'max_agents', 999999,
  'max_api_calls_per_month', 999999,
  'max_conversations_per_month', 999999,
  'max_knowledge_sources', 999999,
  'max_team_members', 50,
  'max_webhooks', 50
)
WHERE name = 'Enterprise';

-- Add trigger to auto-update updated_at on email_templates
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to auto-update updated_at on pending_invitations
CREATE TRIGGER update_pending_invitations_updated_at
  BEFORE UPDATE ON public.pending_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();