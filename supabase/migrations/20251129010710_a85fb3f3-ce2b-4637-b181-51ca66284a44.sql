-- Fix search_path for search_knowledge_sources function
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
SECURITY DEFINER
SET search_path = public
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