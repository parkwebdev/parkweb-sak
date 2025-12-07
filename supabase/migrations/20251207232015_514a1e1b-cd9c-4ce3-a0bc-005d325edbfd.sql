-- Add embedding column to help_articles for RAG
ALTER TABLE public.help_articles 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create index for similarity search on help_articles
CREATE INDEX IF NOT EXISTS help_articles_embedding_idx 
ON public.help_articles 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function to search help articles by embedding
CREATE OR REPLACE FUNCTION public.search_help_articles(
  p_agent_id uuid,
  p_query_embedding vector,
  p_match_threshold double precision DEFAULT 0.7,
  p_match_count integer DEFAULT 3
)
RETURNS TABLE(
  article_id uuid,
  title text,
  content text,
  category_name text,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ha.id as article_id,
    ha.title,
    ha.content,
    hc.name as category_name,
    (1 - (ha.embedding <=> p_query_embedding))::FLOAT as similarity
  FROM help_articles ha
  LEFT JOIN help_categories hc ON hc.id = ha.category_id
  WHERE ha.agent_id = p_agent_id
    AND ha.embedding IS NOT NULL
    AND (1 - (ha.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY ha.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;