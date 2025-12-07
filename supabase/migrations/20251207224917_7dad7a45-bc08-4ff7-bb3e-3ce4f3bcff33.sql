-- Create knowledge_chunks table for chunk-level embeddings
CREATE TABLE public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Index for efficient similarity search
CREATE INDEX knowledge_chunks_embedding_idx 
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for fast lookups
CREATE INDEX knowledge_chunks_source_idx ON knowledge_chunks(source_id);
CREATE INDEX knowledge_chunks_agent_idx ON knowledge_chunks(agent_id);

-- RLS Policies
CREATE POLICY "Users can view accessible knowledge chunks"
ON public.knowledge_chunks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM knowledge_sources ks
    WHERE ks.id = knowledge_chunks.source_id
    AND has_account_access(ks.user_id)
  )
);

CREATE POLICY "Users can delete accessible knowledge chunks"
ON public.knowledge_chunks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM knowledge_sources ks
    WHERE ks.id = knowledge_chunks.source_id
    AND has_account_access(ks.user_id)
  )
);

-- Service role can insert chunks (from edge function)
CREATE POLICY "Service can insert chunks"
ON public.knowledge_chunks FOR INSERT
WITH CHECK (true);

-- Create new search function for chunks
CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(
  p_agent_id UUID,
  p_query_embedding vector(1536),
  p_match_threshold FLOAT DEFAULT 0.7,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  chunk_id UUID,
  source_id UUID,
  source_name TEXT,
  source_type TEXT,
  content TEXT,
  chunk_index INTEGER,
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