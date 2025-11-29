-- Create index for vector similarity search on knowledge_sources
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_embedding 
ON public.knowledge_sources 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function to search knowledge sources by similarity
CREATE OR REPLACE FUNCTION public.search_knowledge_sources(
  p_agent_id UUID,
  p_query_embedding vector,
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  agent_id UUID,
  org_id UUID,
  type text,
  source TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ks.id,
    ks.agent_id,
    ks.org_id,
    ks.type::text,
    ks.source,
    ks.content,
    ks.metadata,
    1 - (ks.embedding <=> p_query_embedding) AS similarity
  FROM public.knowledge_sources ks
  WHERE 
    ks.agent_id = p_agent_id
    AND ks.status = 'ready'
    AND ks.embedding IS NOT NULL
    AND 1 - (ks.embedding <=> p_query_embedding) > p_match_threshold
  ORDER BY ks.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_knowledge_sources(UUID, vector, FLOAT, INT) TO authenticated;