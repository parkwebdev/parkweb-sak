-- Create help categories table
CREATE TABLE public.help_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, name)
);

-- Create help articles table
CREATE TABLE public.help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.help_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create article feedback table
CREATE TABLE public.article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.help_articles(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(article_id, session_id)
);

-- Enable RLS
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for help_categories
CREATE POLICY "Org members can view help categories"
  ON public.help_categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = help_categories.agent_id
      AND is_org_member(auth.uid(), agents.org_id)
    )
  );

CREATE POLICY "Org admins can manage help categories"
  ON public.help_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = help_categories.agent_id
      AND is_org_admin(auth.uid(), agents.org_id)
    )
  );

CREATE POLICY "Public can view help categories"
  ON public.help_categories
  FOR SELECT
  USING (true);

-- RLS Policies for help_articles
CREATE POLICY "Org members can view help articles"
  ON public.help_articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = help_articles.agent_id
      AND is_org_member(auth.uid(), agents.org_id)
    )
  );

CREATE POLICY "Org admins can manage help articles"
  ON public.help_articles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE agents.id = help_articles.agent_id
      AND is_org_admin(auth.uid(), agents.org_id)
    )
  );

CREATE POLICY "Public can view help articles"
  ON public.help_articles
  FOR SELECT
  USING (true);

-- RLS Policies for article_feedback
CREATE POLICY "Anyone can submit feedback"
  ON public.article_feedback
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Org members can view feedback"
  ON public.article_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.help_articles
      JOIN public.agents ON agents.id = help_articles.agent_id
      WHERE help_articles.id = article_feedback.article_id
      AND is_org_member(auth.uid(), agents.org_id)
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_help_categories_agent_id ON public.help_categories(agent_id);
CREATE INDEX idx_help_articles_agent_id ON public.help_articles(agent_id);
CREATE INDEX idx_help_articles_category_id ON public.help_articles(category_id);
CREATE INDEX idx_article_feedback_article_id ON public.article_feedback(article_id);

-- Add triggers for updated_at
CREATE TRIGGER update_help_categories_updated_at
  BEFORE UPDATE ON public.help_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON public.help_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();