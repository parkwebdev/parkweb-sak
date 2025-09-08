-- Update all email templates to have left-aligned buttons instead of center-aligned
UPDATE email_templates 
SET html_content = REPLACE(html_content, '<div style="text-align: center; margin: 30px 0;">', '<div style="text-align: left; margin: 30px 0;">')
WHERE active = true 
AND html_content LIKE '%text-align: center; margin: 30px 0;%';