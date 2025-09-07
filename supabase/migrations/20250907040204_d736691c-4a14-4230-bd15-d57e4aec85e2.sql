UPDATE email_templates 
SET html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
</head>
<body>
<div style="font-family:Inter,-apple-system,BlinkMacSystemFont,''Segoe UI'',sans-serif;line-height:1.6;color:#333333;margin:0;padding:40px 20px;background-color:#f5f5f5">
  <div style="background-color:#ffffff;max-width:600px;margin:0 auto;border-radius:8px;overflow:hidden">
    
    <!-- Header with Logo -->
    <div style="background-color:#ffffff;text-align:center;border-bottom:1px solid #e0e0e0">
      <div style="text-align:center;background-color:#020202;padding:20px 0 5px;">
        <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="ParkWeb Logo" style="width:60px;height:60px;border-radius:14px;margin-bottom:-40px;border:1px solid #d3d2d2;" />
      </div>
    </div>
    
    <!-- Content -->
    <div style="padding:40px 30px">
      <p style="font-size:14px;margin-bottom:20px;color:#333333">{{client_name}},</p>
      
      <p style="font-size:14px;margin-bottom:24px;color:#333333;line-height:1.6">Thank you for choosing us for <strong>{{company_name}}</strong>''s website project! We''re excited to work with you and create something amazing.</p>
      
      <p style="font-size:14px;margin-bottom:24px;color:#333333;line-height:1.6">To get started, please complete our personalized onboarding form using the link below. This will help us understand your needs and create the perfect website for your business.</p>
      
      <p style="font-size:14px;margin-bottom:30px;color:#333333;line-height:1.6">The onboarding process is quick and easy with personalized questions about your business and clear next steps.</p>
      
      <div style="text-align:center;margin:30px 0">
        <a href="{{onboarding_url}}" style="background-color:#000000;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px;display:inline-block" target="_blank">Start Onboarding</a>
      </div>
      
      <p style="font-size:14px;color:#333333;line-height:1.6">If you have any questions, feel free to reach out to us directly.</p>
    </div>
    
    <!-- Footer -->
    <div style="text-align:center;padding:40px 30px 50px">
      <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20Black%20Square%402x.png" alt="ParkWeb" style="width:40px;height:40px;border-radius:6px;margin:0 auto 20px;display:block" />
      <div style="color:#333333;font-size:14px;font-weight:500;margin-bottom:8px">ParkWeb</div>
      <div style="color:#666666;font-size:12px;margin-bottom:4px">(888) 222-4451</div>
      <div style="color:#666666;font-size:12px;margin-bottom:4px">1020 William Blount Dr. Ste 213</div>
      <div style="color:#666666;font-size:12px">Maryville, TN 37801</div>
    </div>
  </div>
</div>
</body>
</html>'
WHERE name = 'welcome';