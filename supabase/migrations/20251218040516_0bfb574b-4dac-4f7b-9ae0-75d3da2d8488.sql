-- ================================================
-- DATABASE OPTIMIZATION MIGRATION
-- ================================================

-- ================================================
-- PHASE 1: REMOVE DUPLICATE INDEXES
-- ================================================

-- Drop duplicate index on locations (identical to unique constraint index)
DROP INDEX IF EXISTS idx_locations_wordpress_community;

-- Drop redundant index on properties (covered by unique constraint)
DROP INDEX IF EXISTS idx_properties_external_id;

-- ================================================
-- PHASE 2: ADD MISSING CRITICAL INDEXES
-- ================================================

-- Index for conversation takeover lookups by conversation
CREATE INDEX IF NOT EXISTS idx_conversation_takeovers_conversation_id 
ON conversation_takeovers(conversation_id);

-- Partial index for active takeovers (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_conversation_takeovers_active 
ON conversation_takeovers(taken_over_by) 
WHERE returned_to_ai_at IS NULL;

-- Composite index for message fetching (conversation + time ordering)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Index for properties price range queries
CREATE INDEX IF NOT EXISTS idx_properties_agent_price 
ON properties(agent_id, price) 
WHERE status = 'available';

-- ================================================
-- PHASE 3: ADD FOREIGN KEY CONSTRAINTS
-- ================================================

-- messages -> conversations
ALTER TABLE messages
ADD CONSTRAINT fk_messages_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- conversation_takeovers -> conversations
ALTER TABLE conversation_takeovers
ADD CONSTRAINT fk_takeovers_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- conversation_ratings -> conversations
ALTER TABLE conversation_ratings
ADD CONSTRAINT fk_ratings_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- knowledge_chunks -> knowledge_sources
ALTER TABLE knowledge_chunks
ADD CONSTRAINT fk_chunks_source
FOREIGN KEY (source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE;

-- knowledge_chunks -> agents
ALTER TABLE knowledge_chunks
ADD CONSTRAINT fk_chunks_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- help_articles -> help_categories
ALTER TABLE help_articles
ADD CONSTRAINT fk_articles_category
FOREIGN KEY (category_id) REFERENCES help_categories(id) ON DELETE CASCADE;

-- help_articles -> agents
ALTER TABLE help_articles
ADD CONSTRAINT fk_articles_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- help_categories -> agents
ALTER TABLE help_categories
ADD CONSTRAINT fk_categories_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- properties -> knowledge_sources
ALTER TABLE properties
ADD CONSTRAINT fk_properties_source
FOREIGN KEY (knowledge_source_id) REFERENCES knowledge_sources(id) ON DELETE CASCADE;

-- properties -> agents
ALTER TABLE properties
ADD CONSTRAINT fk_properties_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- properties -> locations (SET NULL on delete to preserve property data)
ALTER TABLE properties
ADD CONSTRAINT fk_properties_location
FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- calendar_events -> connected_accounts
ALTER TABLE calendar_events
ADD CONSTRAINT fk_events_account
FOREIGN KEY (connected_account_id) REFERENCES connected_accounts(id) ON DELETE CASCADE;

-- calendar_events -> locations (SET NULL to preserve events)
ALTER TABLE calendar_events
ADD CONSTRAINT fk_events_location
FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- calendar_events -> conversations (SET NULL to preserve events)
ALTER TABLE calendar_events
ADD CONSTRAINT fk_events_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

-- calendar_events -> leads (SET NULL to preserve events)
ALTER TABLE calendar_events
ADD CONSTRAINT fk_events_lead
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

-- connected_accounts -> agents
ALTER TABLE connected_accounts
ADD CONSTRAINT fk_accounts_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- connected_accounts -> locations (SET NULL)
ALTER TABLE connected_accounts
ADD CONSTRAINT fk_accounts_location
FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- locations -> agents
ALTER TABLE locations
ADD CONSTRAINT fk_locations_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- knowledge_sources -> agents
ALTER TABLE knowledge_sources
ADD CONSTRAINT fk_sources_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- knowledge_sources -> locations (SET NULL)
ALTER TABLE knowledge_sources
ADD CONSTRAINT fk_sources_location
FOREIGN KEY (default_location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- leads -> conversations (SET NULL to preserve leads)
ALTER TABLE leads
ADD CONSTRAINT fk_leads_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

-- conversations -> agents
ALTER TABLE conversations
ADD CONSTRAINT fk_conversations_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- conversations -> locations (SET NULL)
ALTER TABLE conversations
ADD CONSTRAINT fk_conversations_location
FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

-- announcements -> agents
ALTER TABLE announcements
ADD CONSTRAINT fk_announcements_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- news_items -> agents
ALTER TABLE news_items
ADD CONSTRAINT fk_news_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- agent_tools -> agents
ALTER TABLE agent_tools
ADD CONSTRAINT fk_tools_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- agent_api_keys -> agents
ALTER TABLE agent_api_keys
ADD CONSTRAINT fk_apikeys_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- conversation_memories -> agents
ALTER TABLE conversation_memories
ADD CONSTRAINT fk_memories_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- conversation_memories -> conversations (SET NULL)
ALTER TABLE conversation_memories
ADD CONSTRAINT fk_memories_conversation
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

-- conversation_memories -> leads (SET NULL)
ALTER TABLE conversation_memories
ADD CONSTRAINT fk_memories_lead
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

-- conversation_memories -> messages (SET NULL)
ALTER TABLE conversation_memories
ADD CONSTRAINT fk_memories_message
FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- article_feedback -> help_articles
ALTER TABLE article_feedback
ADD CONSTRAINT fk_feedback_article
FOREIGN KEY (article_id) REFERENCES help_articles(id) ON DELETE CASCADE;

-- query_embedding_cache -> agents (SET NULL)
ALTER TABLE query_embedding_cache
ADD CONSTRAINT fk_cache_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL;

-- response_cache -> agents
ALTER TABLE response_cache
ADD CONSTRAINT fk_response_cache_agent
FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE;

-- ================================================
-- PHASE 4: CLEANUP DEPRECATED ITEMS
-- ================================================

-- Drop deprecated org_role enum if it exists and is unused
DO $$
BEGIN
  -- Check if org_role enum exists and drop it
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_role') THEN
    DROP TYPE IF EXISTS org_role;
  END IF;
EXCEPTION
  WHEN dependent_objects_still_exist THEN
    -- Enum is still in use somewhere, skip dropping
    RAISE NOTICE 'org_role enum still in use, skipping drop';
END $$;