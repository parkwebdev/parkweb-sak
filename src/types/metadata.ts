/**
 * Metadata Type Definitions
 * 
 * Type-safe interfaces for JSONB metadata fields stored in Supabase.
 * These replace the `as any` casts throughout the codebase.
 */

/** Page visit tracking for conversation analytics */
export interface VisitedPage {
  url: string;
  visitedAt: string;
  duration?: number;
}

/** Conversation metadata stored in conversations.metadata JSONB field */
export interface ConversationMetadata {
  visitor_id?: string;
  lead_id?: string;
  lead_name?: string;
  lead_email?: string;
  admin_last_read_at?: string;
  last_user_message_at?: string;
  last_message_at?: string;
  last_message_role?: 'user' | 'assistant' | 'human';
  last_message_preview?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: string;
  ip_address?: string;
  country?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  referrer?: string;
  landing_page?: string;
  visited_pages?: VisitedPage[];
  custom_fields?: Record<string, string | number | boolean>;
}

/** Emoji reaction on a message */
export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
  adminReacted?: boolean;
}

/** Rich link preview extracted from message URLs */
export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

/** File attachment on a message */
export interface MessageAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

/** Message metadata stored in messages.metadata JSONB field */
export interface MessageMetadata {
  sender_type?: 'ai' | 'human';
  sender_id?: string;
  sender_name?: string;
  sender_avatar?: string;
  reactions?: MessageReaction[];
  link_previews?: LinkPreview[];
  attachments?: MessageAttachment[];
  pending?: boolean;
}

/** Knowledge source metadata stored in knowledge_sources.metadata JSONB field */
export interface KnowledgeSourceMetadata {
  is_sitemap?: boolean;
  parent_source_id?: string;
  batch_id?: string;
  urls_found?: number;
  child_sitemaps?: number;
  url?: string;
  filename?: string;
  name?: string;
  size?: number;
  chunks_count?: number;
  error?: string;
  processed_at?: string;
  last_progress_at?: string;
}

/** Agent deployment configuration stored in agents.deployment_config JSONB field */
export interface AgentDeploymentConfig {
  customDomain?: string;
  domainVerified?: boolean;
  allowedOrigins?: string[];
}

/** Lead custom data stored in leads.data JSONB field */
export interface LeadData {
  source?: string;
  campaign?: string;
  custom_fields?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

/** Plan limits stored in plans.limits JSONB field */
export interface PlanLimits {
  max_agents?: number;
  max_conversations_per_month?: number;
  max_api_calls_per_month?: number;
  max_knowledge_sources?: number;
  max_team_members?: number;
  max_webhooks?: number;
}

/** Plan features stored in plans.features JSONB field */
export interface PlanFeatures {
  [key: string]: boolean | string | number;
}
