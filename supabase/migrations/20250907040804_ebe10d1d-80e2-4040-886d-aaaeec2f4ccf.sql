UPDATE email_templates 
SET html_content = REGEXP_REPLACE(
  html_content,
  '<div style="text-align:center;padding:40px 30px 50px">.*?</div>\s*</div>\s*</div>',
  '  </div>
</div>',
  'g'
)
WHERE html_content LIKE '%text-align:center;padding:40px 30px 50px%';