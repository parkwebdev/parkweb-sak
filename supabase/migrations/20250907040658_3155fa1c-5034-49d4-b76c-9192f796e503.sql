UPDATE email_templates 
SET html_content = REPLACE(
  html_content,
  'margin-bottom:-40px',
  'margin:0 0 -40px 0'
)
WHERE html_content LIKE '%margin-bottom:-40px%';