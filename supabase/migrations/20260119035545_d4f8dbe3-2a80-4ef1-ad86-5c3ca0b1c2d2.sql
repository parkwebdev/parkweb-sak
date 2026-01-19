-- Fix Related Articles Links in Enhanced Articles
-- These 5 articles have data-related-articles divs with JSON attributes but no actual <a> tags

-- 1. Fix Custom Tools - replace JSON-only related articles with proper links
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-related-articles data-articles=''[^'']*''></div>',
  '<div data-related-articles><a href="/help-center?category=ari&article=api-access">API Access</a><a href="/help-center?category=ari&article=webhooks">Webhooks</a></div>',
  'g'
)
WHERE slug = 'custom-tools' AND category_id = 'ari';

-- 2. Fix Webhooks
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-related-articles data-articles=''[^'']*''></div>',
  '<div data-related-articles><a href="/help-center?category=ari&article=custom-tools">Custom Tools</a><a href="/help-center?category=ari&article=integrations">Integrations</a></div>',
  'g'
)
WHERE slug = 'webhooks' AND category_id = 'ari';

-- 3. Fix Integrations
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-related-articles data-articles=''[^'']*''></div>',
  '<div data-related-articles><a href="/help-center?category=ari&article=webhooks">Webhooks</a><a href="/help-center?category=planner&article=overview">Using the Planner</a></div>',
  'g'
)
WHERE slug = 'integrations' AND category_id = 'ari';

-- 4. Fix API Access
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-related-articles data-articles=''[^'']*''></div>',
  '<div data-related-articles><a href="/help-center?category=ari&article=webhooks">Webhooks</a><a href="/help-center?category=ari&article=custom-tools">Custom Tools</a></div>',
  'g'
)
WHERE slug = 'api-access' AND category_id = 'ari';

-- 5. Fix Using the Planner (overview)
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-related-articles data-articles=''[^'']*''></div>',
  '<div data-related-articles><a href="/help-center?category=ari&article=integrations">Integrations</a><a href="/help-center?category=leads&article=overview">Lead Management</a></div>',
  'g'
)
WHERE slug = 'overview' AND category_id = 'planner';