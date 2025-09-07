UPDATE email_templates 
SET html_content = REGEXP_REPLACE(
  html_content,
  '<!-- Footer -->.*?</div>\s*</div>\s*</div>\s*</body>',
  '    </div>
  </div>
</body>',
  'gs'
)
WHERE html_content LIKE '%<!-- Footer -->%';