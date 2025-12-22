/**
 * React Query Key Factory
 * 
 * Centralized query key management for type-safe cache invalidation.
 * All query keys should be defined here to ensure consistency across the app.
 * 
 * Pattern: Each resource has a factory with:
 * - all: Base key for invalidating all queries of this type
 * - lists: For list queries (optionally filtered)
 * - detail: For single item queries by ID
 * 
 * @example
 * // Invalidate all agent data
 * queryClient.invalidateQueries({ queryKey: queryKeys.agent.all })
 * 
 * // Invalidate specific agent
 * queryClient.invalidateQueries({ queryKey: queryKeys.agent.detail(agentId) })
 * 
 * @module lib/query-keys
 */

export const queryKeys = {
  /**
   * Agent queries - single agent per user
   */
  agent: {
    all: ['agent'] as const,
    detail: (userId: string | undefined) => ['agent', userId] as const,
  },

  /**
   * User profile queries
   */
  profile: {
    all: ['profile'] as const,
    detail: (userId: string | undefined) => ['profile', userId] as const,
  },

  /**
   * Knowledge sources queries
   */
  knowledgeSources: {
    all: ['knowledgeSources'] as const,
    list: (agentId: string | undefined) => ['knowledgeSources', agentId] as const,
  },

  /**
   * Locations queries
   */
  locations: {
    all: ['locations'] as const,
    list: (agentId: string | undefined) => ['locations', agentId] as const,
    detail: (locationId: string) => ['locations', 'detail', locationId] as const,
  },

  /**
   * Help articles queries
   */
  helpArticles: {
    all: ['helpArticles'] as const,
    list: (agentId: string | undefined) => ['helpArticles', agentId] as const,
    detail: (articleId: string) => ['helpArticles', 'detail', articleId] as const,
  },

  /**
   * Help categories queries
   */
  helpCategories: {
    all: ['helpCategories'] as const,
    list: (agentId: string | undefined) => ['helpCategories', agentId] as const,
  },

  /**
   * Announcements queries
   */
  announcements: {
    all: ['announcements'] as const,
    list: (agentId: string | undefined) => ['announcements', agentId] as const,
  },

  /**
   * News items queries
   */
  newsItems: {
    all: ['newsItems'] as const,
    list: (agentId: string | undefined) => ['newsItems', agentId] as const,
  },

  /**
   * Conversations queries
   */
  conversations: {
    all: ['conversations'] as const,
    list: (filters?: { status?: string; agentId?: string }) => 
      ['conversations', filters] as const,
    detail: (conversationId: string) => ['conversations', 'detail', conversationId] as const,
    messages: (conversationId: string) => ['conversations', 'messages', conversationId] as const,
  },

  /**
   * Leads queries
   */
  leads: {
    all: ['leads'] as const,
    list: (filters?: { status?: string }) => ['leads', filters] as const,
    detail: (leadId: string) => ['leads', 'detail', leadId] as const,
  },

  /**
   * Team queries
   */
  team: {
    all: ['team'] as const,
    members: (ownerId: string | undefined) => ['team', 'members', ownerId] as const,
    invitations: (userId: string | undefined) => ['team', 'invitations', userId] as const,
  },

  /**
   * Properties queries
   */
  properties: {
    all: ['properties'] as const,
    list: (agentId: string | undefined) => ['properties', agentId] as const,
  },

  /**
   * Webhooks queries
   */
  webhooks: {
    all: ['webhooks'] as const,
    list: (agentId: string | undefined) => ['webhooks', agentId] as const,
  },

  /**
   * Agent tools queries
   */
  agentTools: {
    all: ['agentTools'] as const,
    list: (agentId: string | undefined) => ['agentTools', agentId] as const,
  },

  /**
   * Connected accounts (calendars) queries
   */
  connectedAccounts: {
    all: ['connectedAccounts'] as const,
    list: (agentId: string | undefined) => ['connectedAccounts', agentId] as const,
  },

  /**
   * Calendar events queries
   */
  calendarEvents: {
    all: ['calendarEvents'] as const,
    list: (filters?: { start?: Date; end?: Date }) => ['calendarEvents', filters] as const,
  },

  /**
   * Analytics queries
   */
  analytics: {
    all: ['analytics'] as const,
    conversations: (params: { start: Date; end: Date }) => 
      ['analytics', 'conversations', params] as const,
    leads: (params: { start: Date; end: Date }) => 
      ['analytics', 'leads', params] as const,
    traffic: (agentId: string | undefined) => ['analytics', 'traffic', agentId] as const,
  },

  /**
   * Notifications queries
   */
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string | undefined) => ['notifications', userId] as const,
    unreadCount: (userId: string | undefined) => ['notifications', 'unread', userId] as const,
  },
} as const;

/**
 * Type helper for query keys
 */
export type QueryKeys = typeof queryKeys;
