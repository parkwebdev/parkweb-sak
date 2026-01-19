-- Fix final welcome article feature card (different icon name)
UPDATE platform_hc_articles SET content = 
  REPLACE(content,
    '<div data-feature-card data-title="Analytics & Insights" data-description="Understand how your AI is performing with detailed metrics on conversations and satisfaction." data-icon="BarChart01"></div>',
    '<div data-feature-card data-icon="BarChart01"><h4>Analytics & Insights</h4><p>Understand how your AI is performing with detailed metrics on conversations and satisfaction.</p></div>')
WHERE slug = 'welcome';