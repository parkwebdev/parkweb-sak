-- Update search_conversation_memories to properly scope memories by lead_id OR conversation_id
-- This prevents memories from leaking across conversations when lead_id is NULL

CREATE OR REPLACE FUNCTION public.search_conversation_memories(
  p_agent_id uuid, 
  p_lead_id uuid, 
  p_query_embedding vector, 
  p_match_threshold double precision DEFAULT 0.6, 
  p_match_count integer DEFAULT 5,
  p_conversation_id uuid DEFAULT NULL
)
RETURNS TABLE(
  memory_id uuid, 
  memory_type text, 
  content text, 
  confidence double precision, 
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
    AND cm.embedding IS NOT NULL
    AND (1 - (cm.embedding <=> p_query_embedding)) > p_match_threshold
    -- FIXED: Require explicit scoping - no more leaky NULL lead_id matches
    AND (
      -- If lead_id provided, only return memories for that specific lead
      (p_lead_id IS NOT NULL AND cm.lead_id = p_lead_id)
      OR
      -- If no lead_id but conversation_id provided, only return memories for that conversation
      (p_lead_id IS NULL AND p_conversation_id IS NOT NULL AND cm.conversation_id = p_conversation_id)
    )
  ORDER BY cm.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$function$;

-- Clean up orphaned memories that have NULL conversation_id and NULL lead_id
-- These are the ones causing cross-conversation leakage
DELETE FROM conversation_memories 
WHERE conversation_id IS NULL 
  AND lead_id IS NULL;