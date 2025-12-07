-- Update search_knowledge_chunks to work with 768-dimension Nomic embeddings
-- Note: This function works with both 1536 (OpenAI) and 768 (Nomic) dimensions
-- The vector comparison operators handle different dimensions automatically

-- Drop and recreate the function with updated signature
DROP FUNCTION IF EXISTS search_knowledge_chunks(uuid, vector, double precision, integer);

CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  p_agent_id UUID,
  p_query_embedding vector,
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  source_id UUID,
  source_name TEXT,
  source_type TEXT,
  content TEXT,
  chunk_index INT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id as chunk_id,
    kc.source_id,
    ks.source as source_name,
    ks.type::text as source_type,
    kc.content,
    kc.chunk_index,
    (1 - (kc.embedding <=> p_query_embedding))::FLOAT as similarity
  FROM knowledge_chunks kc
  JOIN knowledge_sources ks ON ks.id = kc.source_id
  WHERE kc.agent_id = p_agent_id
    AND kc.embedding IS NOT NULL
    AND ks.status = 'ready'
    AND (1 - (kc.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY kc.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;

-- Also update knowledge_chunks index for better performance with new embedding size
-- Note: ivfflat works with any dimension, no change needed for existing index