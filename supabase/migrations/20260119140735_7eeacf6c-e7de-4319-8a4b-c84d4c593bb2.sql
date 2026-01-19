-- Step 1: Convert opening <p> to <h4> after data-step div
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '(<div[^>]*data-step[^>]*>)\s*<p>',
  E'\\1<h4>',
  'g'
)
WHERE content LIKE '%data-step%';

-- Step 2: Convert the corresponding closing </p> to </h4>
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '(data-step[^>]*><h4>[^<]*)</p>',
  E'\\1</h4>',
  'g'
)
WHERE content LIKE '%data-step%';