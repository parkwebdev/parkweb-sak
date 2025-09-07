-- Add performance indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_status_submitted 
ON onboarding_submissions(status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_links_status_date_sent 
ON client_onboarding_links(status, date_sent DESC);

-- Add reminder tracking to client_onboarding_links
ALTER TABLE client_onboarding_links 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Create email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for email templates (admin only for management, all authenticated for reading)
CREATE POLICY "Authenticated users can view active templates" 
ON email_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND active = true);

CREATE POLICY "Admins can manage all templates" 
ON email_templates 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES
('welcome', 'Welcome to Our Onboarding Process', 
'<h1>Welcome {{client_name}}!</h1><p>Thank you for starting the onboarding process for {{company_name}}. Please click <a href="{{onboarding_url}}">here</a> to continue.</p>',
'Welcome {{client_name}}! Thank you for starting the onboarding process for {{company_name}}. Please visit: {{onboarding_url}}',
'{"client_name": "Client Name", "company_name": "Company Name", "onboarding_url": "URL"}'),

('reminder', 'Complete Your Onboarding - {{company_name}}',
'<h1>Don''t forget to complete your onboarding!</h1><p>Hi {{client_name}}, you started the onboarding process for {{company_name}} but haven''t finished yet. <a href="{{onboarding_url}}">Click here to continue</a> where you left off.</p>',
'Hi {{client_name}}, you started the onboarding process for {{company_name}} but haven''t finished yet. Continue at: {{onboarding_url}}',
'{"client_name": "Client Name", "company_name": "Company Name", "onboarding_url": "URL"}'),

('completion', 'Onboarding Complete - {{company_name}}',
'<h1>Thank you for completing your onboarding!</h1><p>Hi {{client_name}}, we''ve received your completed onboarding for {{company_name}}. Our team will review it and be in touch soon.</p>',
'Hi {{client_name}}, we''ve received your completed onboarding for {{company_name}}. Our team will review it and be in touch soon.',
'{"client_name": "Client Name", "company_name": "Company Name"}'),

('follow_up', 'Next Steps for {{company_name}}',
'<h1>Ready for the next step?</h1><p>Hi {{client_name}}, based on your onboarding submission for {{company_name}}, here are the next steps in your project...</p>',
'Hi {{client_name}}, based on your onboarding submission for {{company_name}}, here are the next steps in your project...',
'{"client_name": "Client Name", "company_name": "Company Name"}')

ON CONFLICT (name) DO NOTHING;

-- Create trigger to update updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger function for onboarding completion notifications
CREATE OR REPLACE FUNCTION notify_onboarding_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status change to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Get the user_id from client_onboarding_links table
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      col.user_id,
      'onboarding',
      'Onboarding Completed: ' || NEW.client_name,
      NEW.client_name || ' from ' || COALESCE(col.company_name, 'Unknown Company') || ' has completed their onboarding.',
      jsonb_build_object(
        'submission_id', NEW.id,
        'client_name', NEW.client_name,
        'client_email', NEW.client_email,
        'company_name', col.company_name,
        'industry', NEW.industry,
        'project_type', NEW.project_type,
        'completed_at', NEW.submitted_at
      )
    FROM client_onboarding_links col 
    WHERE col.client_name = NEW.client_name 
      AND col.email = NEW.client_email
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
DROP TRIGGER IF EXISTS onboarding_completion_trigger ON onboarding_submissions;
CREATE TRIGGER onboarding_completion_trigger
  AFTER INSERT OR UPDATE OF status ON onboarding_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_onboarding_completion();

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;