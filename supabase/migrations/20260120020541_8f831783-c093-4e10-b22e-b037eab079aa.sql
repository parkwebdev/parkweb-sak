-- Fix "Understanding Ari" article - convert first <p> in each feature card to <h4>
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '(<div[^>]*data-feature-card[^>]*>)\s*<p>([^<]+)</p>',
  '\1<h4>\2</h4>',
  'g'
)
WHERE id = 'd06d857c-bf1b-4113-9e0e-baf0cd24c2cc';