-- PHASE 4: Semantic Memory Store
-- Stores extracted facts, preferences, and key information from conversations
-- Enables long-term memory that persists across conversation sessions

CREATE TABLE public.conversation_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  
  -- Memory content
  memory_type TEXT NOT NULL CHECK (memory_type IN ('fact', 'preference', 'entity', 'context', 'goal')),
  content TEXT NOT NULL,
  embedding vector(1024), -- Qwen3 embeddings truncated to 1024 dimensions
  
  -- Metadata
  confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  extracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversation_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Owner can manage their memories
CREATE POLICY "Users can manage their agent memories"
  ON public.conversation_memories
  FOR ALL
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM team_members 
      WHERE owner_id = (SELECT user_id FROM agents WHERE id = conversation_memories.agent_id)
      AND member_id = auth.uid()
    )
  );

-- Index for fast lookups by agent and lead
CREATE INDEX idx_conversation_memories_agent_id ON public.conversation_memories(agent_id);
CREATE INDEX idx_conversation_memories_lead_id ON public.conversation_memories(lead_id);
CREATE INDEX idx_conversation_memories_type ON public.conversation_memories(memory_type);

-- Vector index for semantic search
CREATE INDEX idx_conversation_memories_embedding ON public.conversation_memories 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- Trigger for updated_at
CREATE TRIGGER update_conversation_memories_updated_at
  BEFORE UPDATE ON public.conversation_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Function to search memories semantically
CREATE OR REPLACE FUNCTION public.search_conversation_memories(
  p_agent_id UUID,
  p_lead_id UUID,
  p_query_embedding vector,
  p_match_threshold FLOAT DEFAULT 0.6,
  p_match_count INTEGER DEFAULT 5
)
RETURNS TABLE (
  memory_id UUID,
  memory_type TEXT,
  content TEXT,
  confidence FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  -- Set IVFFlat probes for better recall
  SET LOCAL ivfflat.probes = 10;
  
  RETURN QUERY
  SELECT
    cm.id as memory_id,
    cm.memory_type,
    cm.content,
    cm.confidence::FLOAT,
    (1 - (cm.embedding <=> p_query_embedding))::FLOAT as similarity
  FROM conversation_memories cm
  WHERE cm.agent_id = p_agent_id
    AND (p_lead_id IS NULL OR cm.lead_id = p_lead_id OR cm.lead_id IS NULL)
    AND cm.embedding IS NOT NULL
    AND (1 - (cm.embedding <=> p_query_embedding)) > p_match_threshold
  ORDER BY cm.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;