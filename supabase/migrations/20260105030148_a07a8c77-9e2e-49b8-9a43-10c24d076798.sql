-- Create table for tracking KB article views
CREATE TABLE public.kb_article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL,
  article_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint to prevent duplicate views in same session
CREATE UNIQUE INDEX idx_kb_article_views_unique ON public.kb_article_views(category_id, article_slug, session_id);

-- Index for fast category lookups
CREATE INDEX idx_kb_article_views_category ON public.kb_article_views(category_id);

-- Index for popularity queries
CREATE INDEX idx_kb_article_views_popularity ON public.kb_article_views(category_id, article_slug, viewed_at);

-- Enable RLS
ALTER TABLE public.kb_article_views ENABLE ROW LEVEL SECURITY;

-- Anyone can read popularity stats (aggregated, no PII exposed)
CREATE POLICY "Anyone can read article views"
ON public.kb_article_views
FOR SELECT
USING (true);

-- Anyone can insert views (for anonymous tracking)
CREATE POLICY "Anyone can record article views"
ON public.kb_article_views
FOR INSERT
WITH CHECK (true);

-- Create aggregated view for performance
CREATE OR REPLACE VIEW public.kb_article_popularity AS
SELECT 
  category_id,
  article_slug,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_views
FROM public.kb_article_views
WHERE viewed_at > now() - interval '30 days'
GROUP BY category_id, article_slug
ORDER BY view_count DESC;