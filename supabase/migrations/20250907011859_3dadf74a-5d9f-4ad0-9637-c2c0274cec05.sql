-- Update all email templates to match the exact design from the screenshot

-- Update completion template
UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Onboarding Complete</title>
</head>
<body style="font-family: Inter, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; overflow: hidden;">
    
    <!-- Header with Logo -->
    <div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
      <div style="background-color: #ffffff; border: 2px solid #f0f0f0; border-radius: 12px; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: #000000; color: #ffffff; font-weight: bold; font-size: 24px; width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          &lt;W
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; margin-bottom: 20px; color: #333333;">{{client_name}},</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #333333; line-height: 1.6;">Thank you for completing the onboarding process for <strong>{{company_name}}</strong>! We''ve received all your information and our team is already reviewing it.</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #333333; line-height: 1.6;">Our team will review your requirements and prepare a detailed project proposal. You''ll receive a follow-up within 24-48 hours.</p>
      
      <p style="font-size: 16px; margin-bottom: 30px; color: #333333; line-height: 1.6;">If you have any questions in the meantime, feel free to reach out to us directly.</p>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6;">We appreciate your partnership and look forward to working with you.</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 40px 30px 50px;">
      <div style="background-color: #000000; width: 40px; height: 40px; border-radius: 6px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
        <div style="color: #ffffff; font-weight: bold; font-size: 16px;">&lt;W</div>
      </div>
      <div style="color: #333333; font-size: 16px; font-weight: 500; margin-bottom: 8px;">ParkWeb</div>
      <div style="color: #666666; font-size: 14px; margin-bottom: 4px;">(888) 222-4451</div>
      <div style="color: #666666; font-size: 14px;">1000 William Blount Dr. Ste 013</div>
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
<body style="font-family: Inter, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; overflow: hidden;">
    
    <!-- Header with Logo -->
    <div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
      <div style="background-color: #ffffff; border: 2px solid #f0f0f0; border-radius: 12px; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: #000000; color: #ffffff; font-weight: bold; font-size: 24px; width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          &lt;W
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; margin-bottom: 20px; color: #333333;">{{client_name}},</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #333333; line-height: 1.6;">Here''s your secure link to continue the onboarding process for <strong>{{company_name}}</strong>. You can resume exactly where you left off.</p>
      
      <p style="font-size: 16px; margin-bottom: 30px; color: #333333; line-height: 1.6;">This link will expire in 30 days for security purposes. If you need any assistance or have questions, don''t hesitate to reach out!</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{continue_url}}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Continue Onboarding</a>
      </div>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6;">We appreciate your partnership and look forward to working with you.</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 40px 30px 50px;">
      <div style="background-color: #000000; width: 40px; height: 40px; border-radius: 6px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
        <div style="color: #ffffff; font-weight: bold; font-size: 16px;">&lt;W</div>
      </div>
      <div style="color: #333333; font-size: 16px; font-weight: 500; margin-bottom: 8px;">ParkWeb</div>
      <div style="color: #666666; font-size: 14px; margin-bottom: 4px;">(888) 222-4451</div>
      <div style="color: #666666; font-size: 14px;">1000 William Blount Dr. Ste 013</div>
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
<body style="font-family: Inter, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; overflow: hidden;">
    
    <!-- Header with Logo -->
    <div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
      <div style="background-color: #ffffff; border: 2px solid #f0f0f0; border-radius: 12px; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: #000000; color: #ffffff; font-weight: bold; font-size: 24px; width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          &lt;W
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; margin-bottom: 20px; color: #333333;">{{client_name}},</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #333333; line-height: 1.6;">We wanted to follow up on the project for <strong>{{company_name}}</strong> and see if you have any questions or need any additional information.</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #333333; line-height: 1.6;">We can answer any questions about the project, provide additional information or clarification, or schedule a call to discuss next steps.</p>
      
      <p style="font-size: 16px; margin-bottom: 30px; color: #333333; line-height: 1.6;">Feel free to reply to this email or reach out to us directly.</p>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6;">We appreciate your partnership and look forward to working with you.</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 40px 30px 50px;">
      <div style="background-color: #000000; width: 40px; height: 40px; border-radius: 6px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
        <div style="color: #ffffff; font-weight: bold; font-size: 16px;">&lt;W</div>
      </div>
      <div style="color: #333333; font-size: 16px; font-weight: 500; margin-bottom: 8px;">ParkWeb</div>
      <div style="color: #666666; font-size: 14px; margin-bottom: 4px;">(888) 222-4451</div>
      <div style="color: #666666; font-size: 14px;">1000 William Blount Dr. Ste 013</div>
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
<body style="font-family: Inter, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; overflow: hidden;">
    
    <!-- Header with Logo -->
    <div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
      <div style="background-color: #ffffff; border: 2px solid #f0f0f0; border-radius: 12px; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: #000000; color: #ffffff; font-weight: bold; font-size: 24px; width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          &lt;W
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; margin-bottom: 20px; color: #333333;">{{client_name}},</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #333333; line-height: 1.6;">Just a friendly reminder that your onboarding for <strong>{{company_name}}</strong> is still in progress. We''d love to help you complete it so we can get started on your project!</p>
      
      <p style="font-size: 16px; margin-bottom: 30px; color: #333333; line-height: 1.6;">No pressure! Complete it whenever you''re ready. We''re here to help if you need anything.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{onboarding_url}}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Complete Onboarding</a>
      </div>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6;">If you have any questions or need assistance, feel free to reach out!</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 40px 30px 50px;">
      <div style="background-color: #000000; width: 40px; height: 40px; border-radius: 6px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
        <div style="color: #ffffff; font-weight: bold; font-size: 16px;">&lt;W</div>
      </div>
      <div style="color: #333333; font-size: 16px; font-weight: 500; margin-bottom: 8px;">ParkWeb</div>
      <div style="color: #666666; font-size: 14px; margin-bottom: 4px;">(888) 222-4451</div>
      <div style="color: #666666; font-size: 14px;">1000 William Blount Dr. Ste 013</div>
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
<body style="font-family: Inter, -apple-system, BlinkMacSystemFont, ''Segoe UI'', sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; margin: 20px; border-radius: 8px; overflow: hidden;">
    
    <!-- Header with Logo -->
    <div style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
      <div style="background-color: #ffffff; border: 2px solid #f0f0f0; border-radius: 12px; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: #000000; color: #ffffff; font-weight: bold; font-size: 24px; width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
          &lt;W
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; margin-bottom: 20px; color: #333333;">{{client_name}},</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #333333; line-height: 1.6;">Thank you for choosing us for <strong>{{company_name}}</strong>''s website project! We''re excited to work with you and create something amazing.</p>
      
      <p style="font-size: 16px; margin-bottom: 24px; color: #333333; line-height: 1.6;">To get started, please complete our personalized onboarding form using the link below. This will help us understand your needs and create the perfect website for your business.</p>
      
      <p style="font-size: 16px; margin-bottom: 30px; color: #333333; line-height: 1.6;">The onboarding process is quick and easy with personalized questions about your business and clear next steps.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{onboarding_url}}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Start Onboarding</a>
      </div>
      
      <p style="font-size: 16px; color: #333333; line-height: 1.6;">If you have any questions, feel free to reach out to us directly.</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align: center; padding: 40px 30px 50px;">
      <div style="background-color: #000000; width: 40px; height: 40px; border-radius: 6px; margin: 0 auto 20px; display: inline-flex; align-items: center; justify-content: center;">
        <div style="color: #ffffff; font-weight: bold; font-size: 16px;">&lt;W</div>
      </div>
      <div style="color: #333333; font-size: 16px; font-weight: 500; margin-bottom: 8px;">ParkWeb</div>
      <div style="color: #666666; font-size: 14px; margin-bottom: 4px;">(888) 222-4451</div>
      <div style="color: #666666; font-size: 14px;">1000 William Blount Dr. Ste 013</div>
    </div>
  </div>
</body>
</html>'
WHERE name = 'welcome';