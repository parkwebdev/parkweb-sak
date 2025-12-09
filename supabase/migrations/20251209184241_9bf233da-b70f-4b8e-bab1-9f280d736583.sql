-- =====================================================
-- Performance Indexes for Analytics and Queries
-- =====================================================

-- Index for conversations.created_at (analytics queries)
CREATE INDEX IF NOT EXISTS idx_conversations_created_at 
ON public.conversations (created_at DESC);

-- Index for conversations.updated_at (recent activity queries)
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at 
ON public.conversations (updated_at DESC);

-- Composite index for conversation filtering by agent and status
CREATE INDEX IF NOT EXISTS idx_conversations_agent_status 
ON public.conversations (agent_id, status);

-- Index for messages.created_at (conversation history queries)
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON public.messages (conversation_id, created_at DESC);

-- Index for leads by status and created_at
CREATE INDEX IF NOT EXISTS idx_leads_status_created 
ON public.leads (status, created_at DESC);

-- Index for knowledge_sources by agent and status
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_agent_status 
ON public.knowledge_sources (agent_id, status);