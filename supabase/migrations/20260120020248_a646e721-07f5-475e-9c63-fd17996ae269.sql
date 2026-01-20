-- Normalize all headings inside feature cards and step-by-step blocks to h4

-- Step 1: Feature cards - convert h1 opening tags
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '(<div[^>]*data-feature-card[^>]*>)\s*<h1([^>]*)>',
  '\1<h4\2>',
  'gi'
)
WHERE content LIKE '%data-feature-card%' AND content LIKE '%<h1%';

-- Step 2: Feature cards - convert h1 closing tags
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '</h1>(\s*<p)',
  '</h4>\1',
  'gi'
)
WHERE content LIKE '%data-feature-card%';

-- Step 3: Feature cards - convert h2 opening tags
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '(<div[^>]*data-feature-card[^>]*>)\s*<h2([^>]*)>',
  '\1<h4\2>',
  'gi'
)
WHERE content LIKE '%data-feature-card%' AND content LIKE '%<h2%';

-- Step 4: Feature cards - convert h2 closing tags
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '</h2>(\s*<p[^>]*>)',
  '</h4>\1',
  'gi'
)
WHERE content LIKE '%data-feature-card%';

-- Step 5: Step-by-step blocks - convert h1 to h4
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '(<div[^>]*data-step[^>]*>)\s*<h4([^>]*)><h1([^>]*)>([^<]*)</h1>',
  '\1<h4\2>\4',
  'gi'
)
WHERE content LIKE '%data-step%' AND content LIKE '%<h1%';

-- Step 6: Step-by-step blocks - convert standalone h1 to h4
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '(<div[^>]*data-step[^>]*>)\s*<h1([^>]*)>([^<]*)</h1>',
  '\1<h4\2>\3</h4>',
  'gi'
)
WHERE content LIKE '%data-step%' AND content LIKE '%<h1%';

-- Step 7: Step-by-step blocks - convert h2 to h4
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '(<div[^>]*data-step[^>]*>)\s*<h4([^>]*)><h2([^>]*)>([^<]*)</h2>',
  '\1<h4\2>\4',
  'gi'
)
WHERE content LIKE '%data-step%' AND content LIKE '%<h2%';

-- Step 8: Step-by-step blocks - convert standalone h2 to h4
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '(<div[^>]*data-step[^>]*>)\s*<h2([^>]*)>([^<]*)</h2>',
  '\1<h4\2>\3</h4>',
  'gi'
)
WHERE content LIKE '%data-step%' AND content LIKE '%<h2%';

-- Step 9: Clean up any nested h4 tags that may have been created
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '<h4([^>]*)><h4([^>]*)>',
  '<h4\1>',
  'gi'
)
WHERE content LIKE '%<h4%<h4%';

-- Step 10: Clean up closing tags
UPDATE platform_hc_articles
SET content = REGEXP_REPLACE(
  content,
  '</h4></h4>',
  '</h4>',
  'gi'
)
WHERE content LIKE '%</h4></h4>%';