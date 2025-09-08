-- Update all email templates to have the black header like the welcome template
UPDATE email_templates 
SET html_content = REPLACE(
  html_content, 
  '<div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
      <div style="text-align: center;">
        <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="ParkWeb Logo" style="width: 60px; height: 60px; border-radius: 8px;" />
      </div>
    </div>',
  '<div style="background-color: #ffffff; text-align: center; border-bottom: 1px solid #e0e0e0;">
      <div style="text-align: center; background-color: #020202; padding: 20px 0 5px;">
        <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="ParkWeb Logo" style="width: 60px; height: 60px; border-radius: 14px; margin: 0 0 -40px 0; border: 1px solid #d3d2d2;" />
      </div>
    </div>'
)
WHERE active = true 
AND name != 'welcome'
AND html_content LIKE '%background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;%';

-- Create the missing follow_up email template
INSERT INTO email_templates (name, subject, html_content, text_content, active)
VALUES (
  'follow_up',
  'Following up on your project - {{company_name}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Follow Up</title>
</head>
<body>
<div style="font-family:Inter,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;line-height:1.6;color:#333333;margin:0;padding:40px 20px;background-color:#f5f5f5">
  <div style="background-color:#ffffff;max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden">
    
    <!-- Header with Logo -->
    <div style="background-color:#ffffff;text-align:center;border-bottom:1px solid #e0e0e0">
      <div style="text-align:center;background-color:#020202;padding:20px 0 5px;">
        <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="ParkWeb Logo" style="width:60px;height:60px;border-radius:14px;margin:0 0 -40px 0;border:1px solid #d3d2d2;" />
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding:40px 30px">
      <p style="font-size:14px;margin-bottom:20px;color:#333333">{{client_name}},</p>
      
      <p style="font-size:14px;margin-bottom:24px;color:#333333;line-height:1.6">We hope you''re doing well! We wanted to follow up regarding your project with <strong>{{company_name}}</strong>.</p>
      
      <p style="font-size:14px;margin-bottom:24px;color:#333333;line-height:1.6">Our team has been working on your project and we''d love to share some updates with you. We''re committed to delivering exceptional results and want to ensure everything meets your expectations.</p>
      
      <p style="font-size:14px;margin-bottom:30px;color:#333333;line-height:1.6">Please let us know if you have any questions or would like to schedule a call to discuss progress.</p>
      
      <p style="font-size:14px;color:#333333;line-height:1.6">We appreciate your partnership and look forward to working with you.</p>
    </div>
    
        </div>
  </div>
</body>
</html>',
  'Hello {{client_name}},

We hope you''re doing well! We wanted to follow up regarding your project with {{company_name}}.

Our team has been working on your project and we''d love to share some updates with you. We''re committed to delivering exceptional results and want to ensure everything meets your expectations.

Please let us know if you have any questions or would like to schedule a call to discuss progress.

We appreciate your partnership and look forward to working with you.

Best regards,
ParkWeb Team',
  true
);