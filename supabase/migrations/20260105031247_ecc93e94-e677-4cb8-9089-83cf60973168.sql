-- Create kb_article_feedback table
CREATE TABLE public.kb_article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL,
  article_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- One feedback per session per article
  CONSTRAINT unique_kb_article_feedback UNIQUE (category_id, article_slug, session_id)
);

-- Enable RLS
ALTER TABLE public.kb_article_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (for anonymous users)
CREATE POLICY "Anyone can insert feedback"
  ON public.kb_article_feedback FOR INSERT
  WITH CHECK (true);

-- Users can view their own feedback (by session or user_id)
CREATE POLICY "Users can view own feedback"
  ON public.kb_article_feedback FOR SELECT
  USING (
    user_id = auth.uid() 
    OR session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- Create index for faster lookups
CREATE INDEX idx_kb_article_feedback_lookup 
  ON public.kb_article_feedback(category_id, article_slug, session_id);