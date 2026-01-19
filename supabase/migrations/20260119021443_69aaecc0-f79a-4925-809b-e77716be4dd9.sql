-- Fix HTML attribute names to match TipTap node extensions
UPDATE platform_hc_articles
SET content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(content, 
            'data-hc-callout', 'data-callout'),
          'data-variant=', 'data-callout-type='),
        'data-hc-feature-grid', 'data-feature-grid'),
      'data-hc-feature-card', 'data-feature-card'),
    'data-hc-feature-icon', 'data-feature-icon'),
  'data-hc-related-articles', 'data-related-articles'),
updated_at = NOW()
WHERE content LIKE '%data-hc-%' OR content LIKE '%data-variant=%';