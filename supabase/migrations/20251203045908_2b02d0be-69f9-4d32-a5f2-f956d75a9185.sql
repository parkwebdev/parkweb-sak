-- Add featured_image column to help_articles table
ALTER TABLE help_articles 
ADD COLUMN featured_image text;

COMMENT ON COLUMN help_articles.featured_image IS 'URL to the featured/hero image for the article';