-- Update all email templates to use ShadCN neutral colors and remove gradients/emojis

-- Update completion template
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Complete</title>
</head>
<body style="font-family: Inter, sans-serif; line-height: 1.6; color: hsl(0 0% 3.9%); max-width: 600px; margin: 0 auto; padding: 20px; background-color: hsl(0 0% 96.1%);">
  <div style="background-color: hsl(0 0% 100%); border-radius: 8px; overflow: hidden; border: 1px solid hsl(0 0% 89.8%);">
    
    <!-- Header -->
    <div style="background-color: hsl(0 0% 9%); padding: 24px; text-align: center;">
      <h1 style="color: hsl(0 0% 98%); margin: 0; font-size: 20px; font-weight: 600; font-family: Inter, sans-serif;">Thank You!</h1>
      <p style="color: hsl(0 0% 98%); margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-family: Inter, sans-serif;">Your onboarding is complete</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin-bottom: 20px; font-family: Inter, sans-serif;">Hi <strong>{{client_name}}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; font-family: Inter, sans-serif;">Thank you for completing the onboarding process for <strong>{{company_name}}</strong>! We''ve received all your information and our team is already reviewing it.</p>
      
      <div style="background-color: hsl(0 0% 96.1%); padding: 20px; border-radius: 6px; margin: 24px 0; border: 1px solid hsl(0 0% 89.8%);">
        <h3 style="margin: 0 0 12px 0; color: hsl(0 0% 9%); font-family: Inter, sans-serif; font-size: 16px; font-weight: 600;">What happens next?</h3>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6; font-family: Inter, sans-serif; color: hsl(0 0% 45.1%);">
          <li>Our team will review your requirements</li>
          <li>We''ll prepare a detailed project proposal</li>
          <li>You''ll receive a follow-up within 24-48 hours</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: hsl(0 0% 45.1%); margin-top: 24px; font-family: Inter, sans-serif;">If you have any questions in the meantime, feel free to reach out to us directly.</p>
      
      <p style="font-size: 16px; margin-top: 20px; font-family: Inter, sans-serif;">Best regards,<br><strong>Your Web Design Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: hsl(0 0% 96.1%); padding: 20px; text-align: center; border-top: 1px solid hsl(0 0% 89.8%);">
      <p style="color: hsl(0 0% 45.1%); font-size: 12px; margin: 0; font-family: Inter, sans-serif;">
        You''re receiving this because you completed our onboarding process.
      </p>
    </div>
  </div>
</body>
</html>'
WHERE name = 'completion';

-- Update continue_link template
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Continue Your Onboarding</title>
</head>
<body style="font-family: Inter, sans-serif; line-height: 1.6; color: hsl(0 0% 3.9%); max-width: 600px; margin: 0 auto; padding: 20px; background-color: hsl(0 0% 96.1%);">
  <div style="background-color: hsl(0 0% 100%); border-radius: 8px; overflow: hidden; border: 1px solid hsl(0 0% 89.8%);">
    
    <!-- Header -->
    <div style="background-color: hsl(0 0% 9%); padding: 24px; text-align: center;">
      <h1 style="color: hsl(0 0% 98%); margin: 0; font-size: 20px; font-weight: 600; font-family: Inter, sans-serif;">Your Link is Ready!</h1>
      <p style="color: hsl(0 0% 98%); margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-family: Inter, sans-serif;">Continue your onboarding</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin-bottom: 20px; font-family: Inter, sans-serif;">Hi <strong>{{client_name}}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; font-family: Inter, sans-serif;">Here''s your secure link to continue the onboarding process for <strong>{{company_name}}</strong>. You can resume exactly where you left off:</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{continue_url}}" style="background-color: hsl(0 0% 9%); color: hsl(0 0% 98%); padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; font-family: Inter, sans-serif;">Continue Onboarding →</a>
      </div>
      
      <div style="background-color: hsl(0 0% 96.1%); padding: 16px; border-radius: 6px; margin: 24px 0; border: 1px solid hsl(0 0% 89.8%);">
        <p style="margin: 0; font-size: 14px; color: hsl(0 0% 45.1%); font-family: Inter, sans-serif;"><strong style="color: hsl(0 0% 9%);">Note:</strong> This link will expire in 30 days for security purposes.</p>
      </div>
      
      <p style="font-size: 14px; color: hsl(0 0% 45.1%); margin-top: 24px; font-family: Inter, sans-serif;">If you need any assistance or have questions, don''t hesitate to reach out!</p>
      
      <p style="font-size: 16px; margin-top: 20px; font-family: Inter, sans-serif;">Best regards,<br><strong>Your Web Design Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: hsl(0 0% 96.1%); padding: 20px; text-align: center; border-top: 1px solid hsl(0 0% 89.8%);">
      <p style="color: hsl(0 0% 45.1%); font-size: 12px; margin: 0; font-family: Inter, sans-serif;">
        You''re receiving this because you have an active onboarding session.
      </p>
    </div>
  </div>
</body>
</html>'
WHERE name = 'continue_link';

-- Update follow_up template
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Follow Up</title>
</head>
<body style="font-family: Inter, sans-serif; line-height: 1.6; color: hsl(0 0% 3.9%); max-width: 600px; margin: 0 auto; padding: 20px; background-color: hsl(0 0% 96.1%);">
  <div style="background-color: hsl(0 0% 100%); border-radius: 8px; overflow: hidden; border: 1px solid hsl(0 0% 89.8%);">
    
    <!-- Header -->
    <div style="background-color: hsl(0 0% 9%); padding: 24px; text-align: center;">
      <h1 style="color: hsl(0 0% 98%); margin: 0; font-size: 20px; font-weight: 600; font-family: Inter, sans-serif;">Following Up</h1>
      <p style="color: hsl(0 0% 98%); margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-family: Inter, sans-serif;">How can we help you next?</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin-bottom: 20px; font-family: Inter, sans-serif;">Hi <strong>{{client_name}}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; font-family: Inter, sans-serif;">We wanted to follow up on the project for <strong>{{company_name}}</strong> and see if you have any questions or need any additional information.</p>
      
      <div style="background-color: hsl(0 0% 96.1%); padding: 20px; border-radius: 6px; margin: 24px 0; border: 1px solid hsl(0 0% 89.8%);">
        <h3 style="margin: 0 0 12px 0; color: hsl(0 0% 9%); font-family: Inter, sans-serif; font-size: 16px; font-weight: 600;">How can we help?</h3>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6; font-family: Inter, sans-serif; color: hsl(0 0% 45.1%);">
          <li>Answer any questions about the project</li>
          <li>Provide additional information or clarification</li>
          <li>Schedule a call to discuss next steps</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: hsl(0 0% 45.1%); margin-top: 24px; font-family: Inter, sans-serif;">Feel free to reply to this email or reach out to us directly.</p>
      
      <p style="font-size: 16px; margin-top: 20px; font-family: Inter, sans-serif;">Best regards,<br><strong>Your Web Design Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: hsl(0 0% 96.1%); padding: 20px; text-align: center; border-top: 1px solid hsl(0 0% 89.8%);">
      <p style="color: hsl(0 0% 45.1%); font-size: 12px; margin: 0; font-family: Inter, sans-serif;">
        You''re receiving this as part of our client follow-up process.
      </p>
    </div>
  </div>
</body>
</html>'
WHERE name = 'follow_up';

-- Update reminder template
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Friendly Reminder</title>
</head>
<body style="font-family: Inter, sans-serif; line-height: 1.6; color: hsl(0 0% 3.9%); max-width: 600px; margin: 0 auto; padding: 20px; background-color: hsl(0 0% 96.1%);">
  <div style="background-color: hsl(0 0% 100%); border-radius: 8px; overflow: hidden; border: 1px solid hsl(0 0% 89.8%);">
    
    <!-- Header -->
    <div style="background-color: hsl(0 0% 9%); padding: 24px; text-align: center;">
      <h1 style="color: hsl(0 0% 98%); margin: 0; font-size: 20px; font-weight: 600; font-family: Inter, sans-serif;">Friendly Reminder</h1>
      <p style="color: hsl(0 0% 98%); margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-family: Inter, sans-serif;">Your onboarding is waiting</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin-bottom: 20px; font-family: Inter, sans-serif;">Hi <strong>{{client_name}}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; font-family: Inter, sans-serif;">Just a friendly reminder that your onboarding for <strong>{{company_name}}</strong> is still in progress. We''d love to help you complete it so we can get started on your project!</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{onboarding_url}}" style="background-color: hsl(0 0% 9%); color: hsl(0 0% 98%); padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; font-family: Inter, sans-serif;">Complete Onboarding →</a>
      </div>
      
      <div style="background-color: hsl(0 0% 96.1%); padding: 16px; border-radius: 6px; margin: 24px 0; border: 1px solid hsl(0 0% 89.8%);">
        <p style="margin: 0; font-size: 14px; color: hsl(0 0% 45.1%); font-family: Inter, sans-serif;"><strong style="color: hsl(0 0% 9%);">No pressure!</strong> Complete it whenever you''re ready. We''re here to help if you need anything.</p>
      </div>
      
      <p style="font-size: 14px; color: hsl(0 0% 45.1%); margin-top: 24px; font-family: Inter, sans-serif;">If you have any questions or need assistance, feel free to reach out!</p>
      
      <p style="font-size: 16px; margin-top: 20px; font-family: Inter, sans-serif;">Best regards,<br><strong>Your Web Design Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: hsl(0 0% 96.1%); padding: 20px; text-align: center; border-top: 1px solid hsl(0 0% 89.8%);">
      <p style="color: hsl(0 0% 45.1%); font-size: 12px; margin: 0; font-family: Inter, sans-serif;">
        You''re receiving this because you have an incomplete onboarding form.
      </p>
    </div>
  </div>
</body>
</html>'
WHERE name = 'reminder';

-- Update welcome template
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body style="font-family: Inter, sans-serif; line-height: 1.6; color: hsl(0 0% 3.9%); max-width: 600px; margin: 0 auto; padding: 20px; background-color: hsl(0 0% 96.1%);">
  <div style="background-color: hsl(0 0% 100%); border-radius: 8px; overflow: hidden; border: 1px solid hsl(0 0% 89.8%);">
    
    <!-- Header -->
    <div style="background-color: hsl(0 0% 9%); padding: 24px; text-align: center;">
      <h1 style="color: hsl(0 0% 98%); margin: 0; font-size: 20px; font-weight: 600; font-family: Inter, sans-serif;">Welcome {{client_name}}!</h1>
      <p style="color: hsl(0 0% 98%); margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; font-family: Inter, sans-serif;">Let''s get started on {{company_name}}''s project</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin-bottom: 20px; font-family: Inter, sans-serif;">Hi <strong>{{client_name}}</strong>,</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; font-family: Inter, sans-serif;">Thank you for choosing us for <strong>{{company_name}}</strong>''s website project! We''re excited to work with you and create something amazing.</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; font-family: Inter, sans-serif;">To get started, please complete our personalized onboarding form using the link below. This will help us understand your needs and create the perfect website for your business.</p>
      
      <div style="text-align: center; margin: 24px 0;">
        <a href="{{onboarding_url}}" style="background-color: hsl(0 0% 9%); color: hsl(0 0% 98%); padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; font-family: Inter, sans-serif;">Start Onboarding →</a>
      </div>
      
      <div style="background-color: hsl(0 0% 96.1%); padding: 20px; border-radius: 6px; margin: 24px 0; border: 1px solid hsl(0 0% 89.8%);">
        <h3 style="margin: 0 0 12px 0; color: hsl(0 0% 9%); font-family: Inter, sans-serif; font-size: 16px; font-weight: 600;">What to expect:</h3>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6; font-family: Inter, sans-serif; color: hsl(0 0% 45.1%);">
          <li>Quick and easy onboarding process</li>
          <li>Personalized questions about your business</li>
          <li>Clear next steps and timeline</li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: hsl(0 0% 45.1%); margin-top: 24px; font-family: Inter, sans-serif;">If you have any questions, feel free to reach out to us directly.</p>
      
      <p style="font-size: 16px; margin-top: 20px; font-family: Inter, sans-serif;">Best regards,<br><strong>Your Web Design Team</strong></p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: hsl(0 0% 96.1%); padding: 20px; text-align: center; border-top: 1px solid hsl(0 0% 89.8%);">
      <p style="color: hsl(0 0% 45.1%); font-size: 12px; margin: 0; font-family: Inter, sans-serif;">
        You''re receiving this because you signed up for our services.
      </p>
    </div>
  </div>
</body>
</html>'
WHERE name = 'welcome';