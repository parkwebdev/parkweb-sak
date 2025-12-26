/**
 * Metadata Type Definitions
 * 
 * Type-safe interfaces for JSONB metadata fields stored in Supabase.
 * These replace the `as any` casts throughout the codebase.
 * 
 * @module types/metadata
 * @see Database tables: conversations, messages, knowledge_sources, agents, leads, plans
 * 
 * @example
 * ```typescript
 * import { ConversationMetadata, MessageMetadata } from '@/types/metadata';
 * 
 * const metadata = conversation.metadata as ConversationMetadata;
 * const leadName = metadata.lead_name;
 * ```
 */

/**
 * Page visit tracking for conversation analytics.
 * Records each page visited by the user during a widget session.
 * 
 * @see ConversationMetadata.visited_pages
 */
export interface VisitedPage {
  /** Full URL of the visited page */
  url: string;
  /** ISO timestamp when page was visited */
  visitedAt?: string;
  /** Alternative timestamp format from edge functions */
  entered_at?: string;
  /** Time spent on page in seconds */
  duration?: number;
  /** Time spent on page in milliseconds (alternative format) */
  duration_ms?: number;
}

/**
 * Conversation metadata stored in conversations.metadata JSONB field.
 * Contains visitor information, session data, and admin-editable fields.
 * 
 * @see Database table: conversations
 */
export interface ConversationMetadata {
  // Visitor identification
  /** Unique visitor identifier for presence tracking */
  visitor_id?: string;
  /** Associated lead ID if contact form was submitted */
  lead_id?: string;
  /** Lead name from contact form */
  lead_name?: string;
  /** Lead email from contact form */
  lead_email?: string;
  /** Lead phone from contact form */
  lead_phone?: string;
  /** Lead company from contact form */
  lead_company?: string;
  /** Custom fields from contact form */
  custom_fields?: Record<string, string | number | boolean>;

  // Message tracking
  /** Timestamp when admin last read messages in this conversation */
  admin_last_read_at?: string;
  /** Timestamp of the last message from the user (not team member) */
  last_user_message_at?: string;
  /** Timestamp of the most recent message (any role) */
  last_message_at?: string;
  /** Role of the last message sender */
  last_message_role?: 'user' | 'assistant' | 'human';
  /** Truncated preview of the last message */
  last_message_preview?: string;
  /** Timestamp of first message */
  first_message_at?: string;
  /** Message count in conversation */
  messages_count?: number;

  // Admin-editable fields
  /** Conversation priority for triage */
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'not_set';
  /** Tags for categorization */
  tags?: string[];
  /** Internal notes visible only to team */
  notes?: string;
  /** Assigned team member */
  assigned_to?: string;

  // Session analytics
  /** Visitor's IP address */
  ip_address?: string;
  /** Country derived from IP geolocation */
  country?: string;
  /** City derived from IP geolocation */
  city?: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country_code?: string;
  /** Region/state from geolocation */
  region?: string;
  /** Device category */
  device_type?: 'desktop' | 'mobile' | 'tablet';
  /** Device name */
  device?: string;
  /** Browser name and version */
  browser?: string;
  /** Operating system */
  os?: string;
  /** Referring URL that brought visitor to site (canonical spelling) */
  referrer_url?: string;
  /** @deprecated Use referrer_url instead (kept for backward compatibility with legacy data) */
  referer_url?: string;
  /** General referrer field */
  referrer?: string;
  /** First page visited in session */
  landing_page?: string;
  /** Session start timestamp */
  session_started_at?: string;
  /** All pages visited during session */
  visited_pages?: VisitedPage[];
  /** Referrer journey with UTM tracking */
  referrer_journey?: ReferrerJourney;

  // Language detection
  /** ISO language code detected from conversation (e.g., 'es', 'fr', 'pt-BR') */
  detected_language_code?: string;
  /** Human-readable language name (e.g., 'Spanish', 'French') */
  detected_language?: string;
}

/**
 * Referrer journey tracking with UTM parameters.
 */
export interface ReferrerJourney {
  referrer_url?: string | null;
  landing_page?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  entry_type?: 'direct' | 'organic' | 'referral' | 'social' | 'paid' | 'email';
}

/**
 * Emoji reaction on a message.
 * Tracks reactions from both widget users and admin team members.
 * 
 * @see MessageMetadata.reactions
 */
export interface MessageReaction {
  /** The emoji character */
  emoji: string;
  /** Total count of this reaction */
  count: number;
  /** Whether the widget user reacted with this emoji */
  userReacted?: boolean;
  /** Whether an admin team member reacted with this emoji */
  adminReacted?: boolean;
}

/**
 * Rich link preview extracted from message URLs.
 * Generated server-side via fetch-link-preview edge function.
 * 
 * @see MessageMetadata.link_previews
 */
export interface LinkPreview {
  /** Original URL */
  url: string;
  /** Page title from meta tags */
  title?: string;
  /** Page description from meta tags */
  description?: string;
  /** Preview image URL */
  image?: string;
}

/**
 * File attachment on a message.
 * Supports images, documents, and other file types.
 * 
 * @see MessageMetadata.attachments
 */
export interface MessageAttachment {
  /** Original filename */
  name: string;
  /** Public URL to the uploaded file */
  url: string;
  /** MIME type of the file */
  type: string;
  /** File size in bytes */
  size: number;
}

/**
 * Message metadata stored in messages.metadata JSONB field.
 * Contains sender information, reactions, previews, and attachments.
 * 
 * @see Database table: messages
 */
export interface MessageMetadata {
  /** Distinguishes AI responses from human team member responses */
  sender_type?: 'ai' | 'human';
  /** User ID of the team member who sent the message */
  sender_id?: string;
  /** Display name of the sender */
  sender_name?: string;
  /** Avatar URL of the sender */
  sender_avatar?: string;
  /** Emoji reactions on this message */
  reactions?: MessageReaction[];
  /** Rich link previews for URLs in the message */
  link_previews?: LinkPreview[];
  /** File attachments (alternative structure to 'files') */
  attachments?: MessageAttachment[];
  /** File attachments uploaded with the message */
  files?: MessageAttachment[];
  /** Whether this is an optimistic message pending confirmation */
  pending?: boolean;
  /** Timestamp when message was read by admin */
  read_at?: string;
  /** Error message if message failed to send */
  error?: string;
  /** Whether message failed to send */
  failed?: boolean;
}

/**
 * Knowledge source metadata stored in knowledge_sources.metadata JSONB field.
 * Contains processing state, sitemap hierarchy, and file information.
 * 
 * @see Database table: knowledge_sources
 */
export interface KnowledgeSourceMetadata {
  // Sitemap hierarchy
  /** Whether this source is a sitemap index */
  is_sitemap?: boolean;
  /** Parent source ID for sitemap child pages */
  parent_source_id?: string;
  /** Batch identifier for grouped processing */
  batch_id?: string;
  /** Total URLs found in sitemap */
  urls_found?: number;
  /** Number of child sitemaps in sitemap index */
  child_sitemaps?: number;

  // Source information
  /** Original URL for URL-type sources */
  url?: string;
  /** Original filename for uploaded files */
  filename?: string;
  /** Display name for the source */
  name?: string;
  /** File size in bytes */
  size?: number;

  // Processing state
  /** Number of chunks created from this source */
  chunks_count?: number;
  /** Error message if processing failed */
  error?: string;
  /** ISO timestamp when processing completed */
  processed_at?: string;
  /** ISO timestamp of last progress update (for stall detection) */
  last_progress_at?: string;
  /** Embedding model used (for outdated detection) */
  embedding_model?: string;
}

/**
 * Knowledge source type enum for new source_type column.
 */
export type KnowledgeSourceType = 'url' | 'sitemap' | 'property_listings' | 'property_feed' | 'wordpress_home';

/**
 * Refresh strategy enum for automatic content refreshing.
 */
export type RefreshStrategy = 'manual' | 'hourly_1' | 'hourly_2' | 'hourly_3' | 'hourly_4' | 'hourly_6' | 'hourly_12' | 'daily';

/**
 * Refresh strategy display labels
 */
export const REFRESH_STRATEGY_LABELS: Record<RefreshStrategy, string> = {
  manual: 'Manual only',
  hourly_1: 'Every hour',
  hourly_2: 'Every 2 hours',
  hourly_3: 'Every 3 hours',
  hourly_4: 'Every 4 hours',
  hourly_6: 'Every 6 hours',
  hourly_12: 'Every 12 hours',
  daily: 'Daily',
};

/**
 * Source type display labels
 */
export const SOURCE_TYPE_LABELS: Record<KnowledgeSourceType, string> = {
  url: 'URL',
  sitemap: 'Sitemap',
  property_listings: 'Property Listings',
  property_feed: 'Property Feed',
  wordpress_home: 'WordPress Data',
};

/**
 * Agent deployment configuration stored in agents.deployment_config JSONB field.
 * Controls how the agent is deployed and accessed.
 * 
 * @see Database table: agents
 */
export interface AgentDeploymentConfig {
  // Domain configuration
  /** Custom domain for hosted page */
  customDomain?: string;
  /** Whether custom domain DNS is verified */
  domainVerified?: boolean;
  /** Allowed origins for CORS (API access) */
  allowedOrigins?: string[];

  // Deployment toggles
  /** Whether API endpoint is enabled */
  api_enabled?: boolean;
  /** Whether embeddable widget is enabled */
  widget_enabled?: boolean;
  /** Whether hosted page is enabled */
  hosted_page_enabled?: boolean;
  /** Whether embedded chat is enabled (legacy) */
  embedded_chat_enabled?: boolean;

  // Behavior parameters (stored here, not in agent table)
  /** Top P (nucleus sampling) */
  top_p?: number;
  /** Presence penalty (OpenAI models) */
  presence_penalty?: number;
  /** Frequency penalty (OpenAI models) */
  frequency_penalty?: number;
  /** Top K (Gemini/Claude models) - limits token selection pool */
  top_k?: number;
  /** Enable quick replies suggestions */
  enable_quick_replies?: boolean;
}

/**
 * Lead custom data stored in leads.data JSONB field.
 * Contains source tracking and custom form fields.
 * 
 * @see Database table: leads
 */
export interface LeadData {
  /** Lead acquisition source (widget, api, manual) */
  source?: string;
  /** Marketing campaign identifier */
  campaign?: string;
  /** Custom fields from contact form */
  custom_fields?: Record<string, string | number | boolean>;
  /** Allow additional unknown properties */
  [key: string]: unknown;
}

/**
 * Plan limits stored in plans.limits JSONB field.
 * Defines usage quotas for subscription plans.
 * Single-agent model means no max_agents limit.
 * 
 * @see Database table: plans
 */
export interface PlanLimits {
  /** Maximum conversations per billing period */
  max_conversations_per_month?: number;
  /** Maximum API calls per billing period */
  max_api_calls_per_month?: number;
  /** Maximum knowledge sources per account */
  max_knowledge_sources?: number;
  /** Maximum team members */
  max_team_members?: number;
  /** Maximum webhooks per account */
  max_webhooks?: number;
}

/**
 * Plan features stored in plans.features JSONB field.
 * Feature flags and configuration for subscription plans.
 * 
 * @see Database table: plans
 */
export interface PlanFeatures {
  /** Dynamic feature flags */
  [key: string]: boolean | string | number;
}

/**
 * Notification preferences data structure.
 * Mirrors notification_preferences table columns.
 */
export interface NotificationPreferencesData {
  /** Enable sound notifications for new messages */
  sound_notifications?: boolean;
  /** Enable browser push notifications */
  browser_notifications?: boolean;
  /** Enable email notifications */
  email_notifications?: boolean;
  /** Notify on new conversations */
  conversation_notifications?: boolean;
  /** Notify on new leads */
  lead_notifications?: boolean;
  /** Notify on agent status changes */
  agent_notifications?: boolean;
  /** Notify on team member changes */
  team_notifications?: boolean;
  /** Notify on scheduled report delivery */
  report_notifications?: boolean;
}

/**
 * User preferences data structure.
 * Mirrors user_preferences table columns.
 */
export interface UserPreferencesData {
  /** Enable compact mode UI */
  compact_mode?: boolean;
  /** Auto-save settings */
  auto_save?: boolean;
  /** Default page on login */
  default_project_view?: string;
}

/**
 * Report frequency type.
 */
export type ReportFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * Report type configuration.
 */
export type ReportType = 'summary' | 'detailed' | 'comparison';

/**
 * Data grouping for reports.
 */
export type ReportGrouping = 'day' | 'week' | 'month';

/**
 * Knowledge source type enum.
 */
export type KnowledgeType = 'pdf' | 'url' | 'api' | 'json' | 'xml' | 'csv';
