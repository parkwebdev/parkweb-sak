-- Update email templates to fix logo issues
UPDATE email_templates 
SET html_content = REPLACE(
  REPLACE(
    html_content, 
    '<div style="background-color: #ffffff; border: 2px solid #f0f0f0; border-radius: 12px; width: 80px; height: 80px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
        <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="ParkWeb Logo" style="width: 60px; height: 60px; border-radius: 8px;" />
      </div>',
    '<div style="text-align: center;">
        <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="ParkWeb Logo" style="width: 60px; height: 60px; border-radius: 8px;" />
      </div>'
  ),
  '<img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20White%20Square%402x.png" alt="ParkWeb" style="width: 40px; height: 40px; border-radius: 6px; margin: 0 auto 20px; display: block;" />',
  '<img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/email-assets/Icon%20Only%20-%20Black%20Square%402x.png" alt="ParkWeb" style="width: 40px; height: 40px; border-radius: 6px; margin: 0 auto 20px; display: block;" />'
)
WHERE active = true;