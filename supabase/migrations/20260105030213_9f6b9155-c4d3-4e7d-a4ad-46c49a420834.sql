-- Fix security definer view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.kb_article_popularity;

CREATE OR REPLACE VIEW public.kb_article_popularity 
WITH (security_invoker = true) AS
SELECT 
  category_id,
  article_slug,
  COUNT(*) as view_count,
  COUNT(DISTINCT session_id) as unique_views
FROM public.kb_article_views
WHERE viewed_at > now() - interval '30 days'
GROUP BY category_id, article_slug
ORDER BY view_count DESC;