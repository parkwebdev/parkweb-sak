-- Insert SOW approval email template
INSERT INTO public.email_templates (
  name,
  subject,
  html_content,
  text_content,
  variables,
  active
) VALUES (
  'sow_approval',
  'Your Scope of Work has been approved - {{company_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SOW Approved</title>
</head>
<body style="font-family: Inter, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 40px 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden;">
    
    <!-- Header with Logo -->
    <div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
      <div style="text-align: center;">
        <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="ParkWeb Logo" style="width: 60px; height: 60px; border-radius: 8px;" />
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
        <div style="color: #0ea5e9; font-size: 24px; margin-bottom: 8px;">✓</div>
        <div style="color: #0ea5e9; font-size: 16px; font-weight: 600;">Scope of Work Approved!</div>
      </div>
      
      <p style="font-size: 14px; margin-bottom: 20px; color: #333333;">{{client_name}},</p>
      
      <p style="font-size: 14px; margin-bottom: 24px; color: #333333; line-height: 1.6;">Great news! Your Scope of Work for <strong>{{company_name}}</strong> has been reviewed and approved.</p>
      
      <p style="font-size: 14px; margin-bottom: 24px; color: #333333; line-height: 1.6;"><strong>Project:</strong> {{sow_title}}</p>
      
      <p style="font-size: 14px; margin-bottom: 24px; color: #333333; line-height: 1.6;">Please find the approved Scope of Work document attached to this email. This document outlines all the project details, deliverables, and timeline that we''ve agreed upon.</p>
      
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="font-size: 14px; margin-bottom: 12px; color: #333333; font-weight: 600;">Next Steps:</p>
        <ul style="font-size: 14px; color: #333333; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Review the attached Scope of Work document</li>
          <li style="margin-bottom: 8px;">We''ll begin project work according to the agreed timeline</li>
          <li style="margin-bottom: 8px;">You''ll receive regular updates on project progress</li>
          <li>Contact us if you have any questions or concerns</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; margin-bottom: 30px; color: #333333; line-height: 1.6;">We''re excited to get started on your project and look forward to delivering exceptional results!</p>
      
      <p style="font-size: 14px; color: #333333; line-height: 1.6;">Thank you for choosing ParkWeb for your project needs.</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 40px 30px 50px;">
      <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20Black%20Square%402x.png" alt="ParkWeb" style="width: 40px; height: 40px; border-radius: 6px; margin: 0 auto 20px; display: block;" />
      <div style="color: #333333; font-size: 14px; font-weight: 500; margin-bottom: 8px;">ParkWeb</div>
      <div style="color: #666666; font-size: 12px; margin-bottom: 4px;">(888) 222-4451</div>
      <div style="color: #666666; font-size: 12px; margin-bottom: 4px;">1020 William Blount Dr. Ste 213</div>
      <div style="color: #666666; font-size: 12px;">Maryville, TN 37801</div>
    </div>
  </div>
</body>
</html>',
  'Hi {{client_name}},

Great news! Your Scope of Work for {{company_name}} has been reviewed and approved.

Project: {{sow_title}}

Please find the approved Scope of Work document attached to this email. This document outlines all the project details, deliverables, and timeline that we''ve agreed upon.

Next Steps:
- Review the attached Scope of Work document  
- We''ll begin project work according to the agreed timeline
- You''ll receive regular updates on project progress
- Contact us if you have any questions or concerns

We''re excited to get started on your project and look forward to delivering exceptional results!

Thank you for choosing ParkWeb for your project needs.

Best regards,
The ParkWeb Team

ParkWeb
(888) 222-4451
1020 William Blount Dr. Ste 213
Maryville, TN 37801',
  '{"client_name": "string", "company_name": "string", "sow_title": "string"}',
  true
);