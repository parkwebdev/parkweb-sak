-- Fix Step-by-Step HTML Structure in Enhanced Articles
-- These 5 articles have data-step divs with attributes but no child h4/p elements

-- 1. Fix API Access article steps
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-step data-step-number="([^"]*)" data-step-title="([^"]*)" data-step-description="([^"]*)"></div>',
  '<div data-step data-step-number="\1"><h4>\2</h4><p>\3</p></div>',
  'g'
)
WHERE slug = 'api-access' AND category_id = 'ari';

-- 2. Fix Custom Tools article steps
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-step data-step-number="([^"]*)" data-step-title="([^"]*)" data-step-description="([^"]*)"></div>',
  '<div data-step data-step-number="\1"><h4>\2</h4><p>\3</p></div>',
  'g'
)
WHERE slug = 'custom-tools' AND category_id = 'ari';

-- 3. Fix Integrations article steps
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-step data-step-number="([^"]*)" data-step-title="([^"]*)" data-step-description="([^"]*)"></div>',
  '<div data-step data-step-number="\1"><h4>\2</h4><p>\3</p></div>',
  'g'
)
WHERE slug = 'integrations' AND category_id = 'ari';

-- 4. Fix Webhooks article steps
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-step data-step-number="([^"]*)" data-step-title="([^"]*)" data-step-description="([^"]*)"></div>',
  '<div data-step data-step-number="\1"><h4>\2</h4><p>\3</p></div>',
  'g'
)
WHERE slug = 'webhooks' AND category_id = 'ari';

-- 5. Fix Using the Planner (overview) article steps
UPDATE platform_hc_articles
SET content = regexp_replace(
  content,
  '<div data-step data-step-number="([^"]*)" data-step-title="([^"]*)" data-step-description="([^"]*)"></div>',
  '<div data-step data-step-number="\1"><h4>\2</h4><p>\3</p></div>',
  'g'
)
WHERE slug = 'overview' AND category_id = 'planner';