UPDATE email_templates 
SET html_content = REPLACE(
  html_content,
  'background-color:#000000;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px;display:inline-block',
  'background-color:#000000;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px;display:inline-block'
)
WHERE html_content LIKE '%background-color:#000000;color:#ffffff;padding:12px 24px%';