-- Create email templates table for Resend integration
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

-- Create policies for email templates (public read for active templates, admin write)
CREATE POLICY "Everyone can view active email templates" 
ON email_templates 
FOR SELECT 
USING (active = true);

CREATE POLICY "Admins can manage email templates" 
ON email_templates 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES
('welcome', 
 'Welcome {{client_name}} - Let''s get started on {{company_name}}''s project!',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Our Onboarding</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 28px;">Welcome {{client_name}}!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Let''s create something amazing together</p>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Thank you for choosing us for <strong>{{company_name}}''s</strong> project!</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">To get started, please complete our personalized onboarding form. This will help us understand your vision and create the perfect solution for your business.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{onboarding_url}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Start Your Onboarding →</a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">If you have any questions, don''t hesitate to reach out. We''re here to help!</p>
    
    <p style="font-size: 16px; margin-top: 20px;">Best regards,<br><strong>Your Web Design Team</strong></p>
  </div>
</body>
</html>',
 'Welcome {{client_name}}!

Thank you for choosing us for {{company_name}}''s project!

To get started, please complete our personalized onboarding form: {{onboarding_url}}

This will help us understand your vision and create the perfect solution for your business.

If you have any questions, don''t hesitate to reach out. We''re here to help!

Best regards,
Your Web Design Team',
 '{"client_name": "string", "company_name": "string", "onboarding_url": "string"}'),

('reminder',
 'Don''t forget to complete your onboarding - {{company_name}}',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your Onboarding</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 28px;">👋 Don''t forget about us!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your project is waiting</p>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>{{client_name}}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">You started the onboarding process for <strong>{{company_name}}</strong> but haven''t finished yet. No worries - you can pick up right where you left off!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{onboarding_url}}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Continue Onboarding →</a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">We''re excited to work with you and bring your vision to life. The sooner we get your details, the sooner we can start creating something amazing!</p>
    
    <p style="font-size: 16px; margin-top: 20px;">Best regards,<br><strong>Your Web Design Team</strong></p>
  </div>
</body>
</html>',
 'Hi {{client_name}},

You started the onboarding process for {{company_name}} but haven''t finished yet. No worries - you can pick up right where you left off!

Continue your onboarding: {{onboarding_url}}

We''re excited to work with you and bring your vision to life. The sooner we get your details, the sooner we can start creating something amazing!

Best regards,
Your Web Design Team',
 '{"client_name": "string", "company_name": "string", "onboarding_url": "string"}'),

('completion',
 'Thank you for completing your onboarding - {{company_name}}',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Complete</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 28px;">🎉 Thank You!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Your onboarding is complete</p>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>{{client_name}}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">Thank you for completing the onboarding process for <strong>{{company_name}}</strong>! We''ve received all your information and our team is already reviewing it.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4facfe;">
      <h3 style="margin: 0 0 10px 0; color: #4facfe;">What happens next?</h3>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Our team will review your requirements</li>
        <li>We''ll prepare a detailed project proposal</li>
        <li>You''ll receive a follow-up within 24-48 hours</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">If you have any questions in the meantime, feel free to reach out to us directly.</p>
    
    <p style="font-size: 16px; margin-top: 20px;">Best regards,<br><strong>Your Web Design Team</strong></p>
  </div>
</body>
</html>',
 'Hi {{client_name}},

Thank you for completing the onboarding process for {{company_name}}! We''ve received all your information and our team is already reviewing it.

What happens next?
- Our team will review your requirements
- We''ll prepare a detailed project proposal  
- You''ll receive a follow-up within 24-48 hours

If you have any questions in the meantime, feel free to reach out to us directly.

Best regards,
Your Web Design Team',
 '{"client_name": "string", "company_name": "string"}'),

('continue_link',
 'Continue where you left off - {{company_name}}',
 '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Continue Your Onboarding</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 28px;">🔗 Your Link is Ready!</h1>
    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Continue your onboarding</p>
  </div>
  
  <div style="padding: 30px 0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi <strong>{{client_name}}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">Here''s your secure link to continue the onboarding process for <strong>{{company_name}}</strong>. You can resume exactly where you left off:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{continue_url}}" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Continue Onboarding →</a>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; font-size: 14px; color: #856404;"><strong>Note:</strong> This link will expire in 30 days for security purposes.</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">If you need any assistance or have questions, don''t hesitate to reach out!</p>
    
    <p style="font-size: 16px; margin-top: 20px;">Best regards,<br><strong>Your Web Design Team</strong></p>
  </div>
</body>
</html>',
 'Hi {{client_name}},

Here''s your secure link to continue the onboarding process for {{company_name}}. You can resume exactly where you left off:

{{continue_url}}

Note: This link will expire in 30 days for security purposes.

If you need any assistance or have questions, don''t hesitate to reach out!

Best regards,
Your Web Design Team',
 '{"client_name": "string", "company_name": "string", "continue_url": "string"}');

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_name_active 
ON email_templates(name, active) WHERE active = true;