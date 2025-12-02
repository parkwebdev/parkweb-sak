-- Create news_items table for blog-style updates
CREATE TABLE public.news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  featured_image_url TEXT,
  body TEXT NOT NULL,
  author_name TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own news items"
  ON public.news_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert news items for their agents"
  ON public.news_items
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = news_items.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own news items"
  ON public.news_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own news items"
  ON public.news_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_news_items_agent_id ON public.news_items(agent_id);
CREATE INDEX idx_news_items_published ON public.news_items(is_published, published_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_news_items_updated_at
  BEFORE UPDATE ON public.news_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();