-- Phase 1: Rename Knowledge Base tables to Help Center tables

-- Rename platform_kb_categories to platform_hc_categories
ALTER TABLE IF EXISTS public.platform_kb_categories RENAME TO platform_hc_categories;

-- Rename platform_kb_articles to platform_hc_articles
ALTER TABLE IF EXISTS public.platform_kb_articles RENAME TO platform_hc_articles;

-- Rename the foreign key constraint
ALTER TABLE IF EXISTS public.platform_hc_articles 
  DROP CONSTRAINT IF EXISTS fk_platform_kb_articles_category;

ALTER TABLE IF EXISTS public.platform_hc_articles
  ADD CONSTRAINT fk_platform_hc_articles_category
  FOREIGN KEY (category_id) REFERENCES public.platform_hc_categories(id) ON DELETE CASCADE;

-- Drop old RLS policies on platform_hc_categories (formerly platform_kb_categories)
DROP POLICY IF EXISTS "Super admins can manage platform KB categories" ON public.platform_hc_categories;
DROP POLICY IF EXISTS "All users can read platform KB categories" ON public.platform_hc_categories;

-- Create new RLS policies for platform_hc_categories
CREATE POLICY "Super admins can manage platform HC categories"
ON public.platform_hc_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "All users can read platform HC categories"
ON public.platform_hc_categories
FOR SELECT
USING (true);

-- Drop old RLS policies on platform_hc_articles (formerly platform_kb_articles)
DROP POLICY IF EXISTS "Super admins can manage platform KB articles" ON public.platform_hc_articles;
DROP POLICY IF EXISTS "All users can read published platform KB articles" ON public.platform_hc_articles;

-- Create new RLS policies for platform_hc_articles
CREATE POLICY "Super admins can manage platform HC articles"
ON public.platform_hc_articles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);

CREATE POLICY "All users can read published platform HC articles"
ON public.platform_hc_articles
FOR SELECT
USING (is_published = true);

-- Rename indexes (recreate since ALTER INDEX doesn't work across schemas cleanly)
DROP INDEX IF EXISTS idx_platform_kb_articles_category;
DROP INDEX IF EXISTS idx_platform_kb_articles_slug;
DROP INDEX IF EXISTS idx_platform_kb_articles_published;

CREATE INDEX IF NOT EXISTS idx_platform_hc_articles_category ON public.platform_hc_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_platform_hc_articles_slug ON public.platform_hc_articles(category_id, slug);
CREATE INDEX IF NOT EXISTS idx_platform_hc_articles_published ON public.platform_hc_articles(is_published) WHERE is_published = true;