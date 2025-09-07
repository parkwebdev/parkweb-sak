-- Create draft submissions table for save & continue later
CREATE TABLE IF NOT EXISTS draft_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  draft_data JSONB NOT NULL DEFAULT '{}',
  resume_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE draft_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for drafts
CREATE POLICY "Users can view their own drafts" 
ON draft_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts" 
ON draft_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts" 
ON draft_submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view non-expired drafts by token" 
ON draft_submissions 
FOR SELECT 
USING (expires_at > now());

-- Create onboarding templates table
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  industry TEXT NOT NULL,
  description TEXT,
  form_fields JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for templates (public read, admin write)
CREATE POLICY "Everyone can view active templates" 
ON onboarding_templates 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage templates" 
ON onboarding_templates 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at on templates
CREATE TRIGGER update_onboarding_templates_updated_at
  BEFORE UPDATE ON onboarding_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for updated_at on drafts  
CREATE TRIGGER update_draft_submissions_updated_at
  BEFORE UPDATE ON draft_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add additional performance indexes
CREATE INDEX IF NOT EXISTS idx_client_onboarding_links_user_status 
ON client_onboarding_links(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_draft_submissions_token 
ON draft_submissions(resume_token) WHERE expires_at > now();

CREATE INDEX IF NOT EXISTS idx_draft_submissions_user_email 
ON draft_submissions(user_id, client_email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_templates_industry 
ON onboarding_templates(industry, active) WHERE active = true;