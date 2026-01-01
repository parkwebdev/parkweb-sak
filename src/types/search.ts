/**
 * Type-Safe Search Data Interfaces
 * 
 * Provides strongly-typed interfaces for search functionality
 * with proper database entity types and permission mappings.
 * 
 * @module types/search
 */

import type { Tables } from '@/integrations/supabase/types';
import type { AppPermission } from '@/types/team';

/** Conversation with joined agent data */
export type ConversationWithAgent = Tables<'conversations'> & { 
  agents?: { name: string } | null;
};

/** Lead record */
export type LeadRecord = Tables<'leads'>;

/** Help article with category and agent relations */
export type HelpArticleWithRelations = Tables<'help_articles'> & { 
  help_categories?: { name: string } | null; 
  agents?: { name: string } | null;
};

/** News item with agent relation */
export type NewsItemWithAgent = Tables<'news_items'> & { 
  agents?: { name: string } | null;
};

/** Webhook with agent relation */
export type WebhookWithAgent = Tables<'webhooks'> & { 
  agents?: { name: string } | null;
};

/** Agent tool with agent relation */
export type AgentToolWithAgent = Tables<'agent_tools'> & { 
  agents?: { name: string } | null;
};

/** Knowledge source with agent relation */
export type KnowledgeSourceWithAgent = Tables<'knowledge_sources'> & { 
  agents?: { name: string } | null;
};

/** Profile record for team members */
export type ProfileRecord = Tables<'profiles'>;

/**
 * Type-safe data map for search results.
 * All properties are optional as they're conditionally fetched based on permissions.
 */
export interface SearchDataMap {
  conversations?: ConversationWithAgent[];
  leads?: LeadRecord[];
  helpArticles?: HelpArticleWithRelations[];
  newsItems?: NewsItemWithAgent[];
  webhooks?: WebhookWithAgent[];
  tools?: AgentToolWithAgent[];
  knowledgeSources?: KnowledgeSourceWithAgent[];
  teamMembers?: ProfileRecord[];
}

/** Maps data types to their required permissions */
export const DATA_PERMISSION_MAP: Record<keyof SearchDataMap, AppPermission> = {
  conversations: 'view_conversations',
  leads: 'view_leads',
  helpArticles: 'view_help_articles',
  newsItems: 'view_help_articles',
  webhooks: 'view_webhooks',
  tools: 'manage_ari',
  knowledgeSources: 'view_knowledge',
  teamMembers: 'view_team',
} as const;
