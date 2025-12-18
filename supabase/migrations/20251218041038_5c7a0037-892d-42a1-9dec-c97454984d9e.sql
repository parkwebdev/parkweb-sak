-- Drop 34 duplicate FK constraints (keeping our named fk_* versions)
-- This completes the database optimization by removing redundant auto-generated constraints

ALTER TABLE public.agent_api_keys DROP CONSTRAINT IF EXISTS agent_api_keys_agent_id_fkey;
ALTER TABLE public.agent_tools DROP CONSTRAINT IF EXISTS agent_tools_agent_id_fkey;
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_agent_id_fkey;
ALTER TABLE public.article_feedback DROP CONSTRAINT IF EXISTS article_feedback_article_id_fkey;
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_location_id_fkey;
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_connected_account_id_fkey;
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_lead_id_fkey;
ALTER TABLE public.calendar_events DROP CONSTRAINT IF EXISTS calendar_events_conversation_id_fkey;
ALTER TABLE public.connected_accounts DROP CONSTRAINT IF EXISTS connected_accounts_agent_id_fkey;
ALTER TABLE public.connected_accounts DROP CONSTRAINT IF EXISTS connected_accounts_location_id_fkey;
ALTER TABLE public.conversation_memories DROP CONSTRAINT IF EXISTS conversation_memories_lead_id_fkey;
ALTER TABLE public.conversation_memories DROP CONSTRAINT IF EXISTS conversation_memories_conversation_id_fkey;
ALTER TABLE public.conversation_memories DROP CONSTRAINT IF EXISTS conversation_memories_source_message_id_fkey;
ALTER TABLE public.conversation_memories DROP CONSTRAINT IF EXISTS conversation_memories_agent_id_fkey;
ALTER TABLE public.conversation_ratings DROP CONSTRAINT IF EXISTS conversation_ratings_conversation_id_fkey;
ALTER TABLE public.conversation_takeovers DROP CONSTRAINT IF EXISTS conversation_takeovers_conversation_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_agent_id_fkey;
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_location_id_fkey;
ALTER TABLE public.help_articles DROP CONSTRAINT IF EXISTS help_articles_agent_id_fkey;
ALTER TABLE public.help_articles DROP CONSTRAINT IF EXISTS help_articles_category_id_fkey;
ALTER TABLE public.help_categories DROP CONSTRAINT IF EXISTS help_categories_agent_id_fkey;
ALTER TABLE public.knowledge_chunks DROP CONSTRAINT IF EXISTS knowledge_chunks_agent_id_fkey;
ALTER TABLE public.knowledge_chunks DROP CONSTRAINT IF EXISTS knowledge_chunks_source_id_fkey;
ALTER TABLE public.knowledge_sources DROP CONSTRAINT IF EXISTS knowledge_sources_agent_id_fkey;
ALTER TABLE public.knowledge_sources DROP CONSTRAINT IF EXISTS knowledge_sources_default_location_id_fkey;
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_conversation_id_fkey;
ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_agent_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE public.news_items DROP CONSTRAINT IF EXISTS news_items_agent_id_fkey;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_location_id_fkey;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_agent_id_fkey;
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_knowledge_source_id_fkey;
ALTER TABLE public.query_embedding_cache DROP CONSTRAINT IF EXISTS query_embedding_cache_agent_id_fkey;
ALTER TABLE public.response_cache DROP CONSTRAINT IF EXISTS response_cache_agent_id_fkey;