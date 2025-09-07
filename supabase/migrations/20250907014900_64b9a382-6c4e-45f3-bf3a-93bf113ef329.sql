-- Update email templates to use the correct logo filename
UPDATE email_templates 
SET html_content = REPLACE(html_content, 'parkweb-logo.png', 'Icon%20Only%20-%20White%20Square%402x.png')
WHERE active = true;