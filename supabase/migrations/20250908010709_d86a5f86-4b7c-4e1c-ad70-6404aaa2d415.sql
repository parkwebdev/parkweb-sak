-- Create team invitation email template
INSERT INTO email_templates (
  name,
  subject,
  html_content,
  text_content,
  variables,
  active
) VALUES (
  'team_invitation',
  'You''re invited to join {{company_name}}''s team!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body>
<div style="font-family:Inter,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;line-height:1.6;color:#333333;margin:0;padding:40px 20px;background-color:#f5f5f5">
  <div style="background-color:#ffffff;max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden">
    
    <!-- Header with Logo -->
    <div style="background-color:#ffffff;text-align:center;border-bottom:1px solid #e0e0e0">
      <div style="text-align:center;background-color:#020202;padding:20px 0 5px;">
        <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="Logo" style="width:60px;height:60px;border-radius:14px;margin:0 0 -40px 0;border:1px solid #d3d2d2;" />
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding:40px 30px">
      <p style="font-size:14px;margin-bottom:20px;color:#333333">Hello!</p>
      
      <p style="font-size:14px;margin-bottom:24px;color:#333333;line-height:1.6">{{invited_by}} has invited you to join <strong>{{company_name}}</strong>''s team. You''ll be able to collaborate on projects and access team resources.</p>
      
      <p style="font-size:14px;margin-bottom:24px;color:#333333;line-height:1.6">To get started, please create your account using the link below. You''ll be able to set your password and complete your profile.</p>
      
      <div style="text-align:left;margin:30px 0">
        <a href="{{signup_url}}" style="background-color:#000000;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px;display:inline-block" target="_blank">Join Team</a>
      </div>
      
      <p style="font-size:14px;color:#333333;line-height:1.6">If you have any questions, feel free to reach out to us directly.</p>
      
      <p style="font-size:12px;color:#888888;margin-top:40px;border-top:1px solid #e0e0e0;padding-top:20px">This invitation was sent by {{invited_by}}. If you weren''t expecting this invitation, you can safely ignore this email.</p>
    </div>
    
  </div>
</div>
</body>
</html>',
  'Team Invitation

Hello!

{{invited_by}} has invited you to join {{company_name}}''s team.

To get started, please create your account: {{signup_url}}

You''ll be able to set your password and complete your profile.

If you have any questions, feel free to reach out to us directly.

This invitation was sent by {{invited_by}}.',
  '{"invited_by": "string", "company_name": "string", "signup_url": "string"}',
  true
);