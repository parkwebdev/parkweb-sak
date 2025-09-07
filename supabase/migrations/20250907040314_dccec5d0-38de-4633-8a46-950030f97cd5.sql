UPDATE email_templates 
SET html_content = REPLACE(
  html_content, 
  'text-align:center;margin:30px 0',
  'text-align:left;margin:30px 0'
)
WHERE html_content LIKE '%text-align:center;margin:30px 0%';