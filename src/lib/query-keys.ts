/**
 * Query Key Factory
 * 
 * Centralized query key factory for React Query.
 * Ensures consistent cache key generation and simplifies cache invalidation.
 * 
 * @module lib/query-keys
 * 
 * @example
 * ```tsx
 * // In a hook
 * const { data } = useQuery({
 *   queryKey: queryKeys.agent.detail(userId),
 *   queryFn: fetchAgent,
 * });
 * 
 * // Invalidating related queries
 * queryClient.invalidateQueries({ queryKey: queryKeys.agent.all });
 * ```
 */

/**
 * Query key factory for consistent cache management.
 * 
 * Structure follows the pattern:
 * - `all`: Base key for invalidating all queries of this type
 * - `lists`: All list queries
 * - `list(filters)`: Specific list with filters
 * - `details`: All detail queries  
 * - `detail(id)`: Specific detail by ID
 */
export const queryKeys = {
  // Account scoping
  account: {
    all: ['account'] as const,
    ownerId: (userId?: string) => ['account', 'owner-id', userId] as const,
  },

  // Agent keys
  agent: {
    all: ['agent'] as const,
    detail: (userId?: string) => ['agent', 'detail', userId] as const,
  },

  // Profile keys
  profile: {
    all: ['profile'] as const,
    detail: (userId: string) => ['profile', 'detail', userId] as const,
  },

  // Knowledge sources
  knowledgeSources: {
    all: ['knowledge-sources'] as const,
    lists: () => [...queryKeys.knowledgeSources.all, 'list'] as const,
    list: (agentId: string) => [...queryKeys.knowledgeSources.lists(), agentId] as const,
  },

  // Locations
  locations: {
    all: ['locations'] as const,
    lists: () => [...queryKeys.locations.all, 'list'] as const,
    list: (agentId: string) => [...queryKeys.locations.lists(), agentId] as const,
  },

  // Help articles
  helpArticles: {
    all: ['help-articles'] as const,
    lists: () => [...queryKeys.helpArticles.all, 'list'] as const,
    list: (agentId: string) => [...queryKeys.helpArticles.lists(), agentId] as const,
  },

  // Help categories
  helpCategories: {
    all: ['help-categories'] as const,
    lists: () => [...queryKeys.helpCategories.all, 'list'] as const,
    list: (agentId: string) => [...queryKeys.helpCategories.lists(), agentId] as const,
  },

  // Announcements
  announcements: {
    all: ['announcements'] as const,
    lists: () => [...queryKeys.announcements.all, 'list'] as const,
    list: (agentId: string) => [...queryKeys.announcements.lists(), agentId] as const,
  },

  // News items
  newsItems: {
    all: ['news-items'] as const,
    lists: () => [...queryKeys.newsItems.all, 'list'] as const,
    list: (agentId: string) => [...queryKeys.newsItems.lists(), agentId] as const,
  },

  // Conversations
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters?: { status?: string; ownerId?: string | null }) =>
      [...queryKeys.conversations.lists(), filters] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
    messages: (conversationId: string) =>
      [...queryKeys.conversations.detail(conversationId), 'messages'] as const,
  },

  // Leads
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters?: { status?: string; ownerId?: string | null }) => [...queryKeys.leads.lists(), filters] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leads.details(), id] as const,
  },

  // Lead stages
  leadStages: ['lead-stages'] as const,

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    conversations: (params: { startDate: string; endDate: string; agentId?: string }) =>
      [...queryKeys.analytics.all, 'conversations', params] as const,
    traffic: (params: { startDate: string; endDate: string; agentId?: string }) =>
      [...queryKeys.analytics.all, 'traffic', params] as const,
    leads: (params: { startDate: string; endDate: string }) =>
      [...queryKeys.analytics.all, 'leads', params] as const,
    bookings: (params: { startDate: string; endDate: string; agentId?: string }) =>
      [...queryKeys.analytics.all, 'bookings', params] as const,
    satisfaction: (params: { startDate: string; endDate: string; userId?: string }) =>
      [...queryKeys.analytics.all, 'satisfaction', params] as const,
    aiPerformance: (params: { startDate: string; endDate: string; userId?: string }) =>
      [...queryKeys.analytics.all, 'ai-performance', params] as const,
  },

  // Team
  team: {
    all: ['team'] as const,
    lists: () => [...queryKeys.team.all, 'list'] as const,
    list: (ownerId?: string) => [...queryKeys.team.lists(), ownerId] as const,
    invitations: () => [...queryKeys.team.all, 'invitations'] as const,
  },

  // Webhooks  
  webhooks: {
    all: ['webhooks'] as const,
    lists: () => [...queryKeys.webhooks.all, 'list'] as const,
    list: (agentId: string) => [...queryKeys.webhooks.lists(), agentId] as const,
    logs: (webhookId?: string) => [...queryKeys.webhooks.all, 'logs', webhookId] as const,
  },

  // Agent API keys
  agentApiKeys: {
    all: ['agent-api-keys'] as const,
    lists: () => [...queryKeys.agentApiKeys.all, 'list'] as const,
    list: (agentId: string) => [...queryKeys.agentApiKeys.lists(), agentId] as const,
  },

  // Calendar events
  calendarEvents: {
    all: ['calendar-events'] as const,
    lists: () => [...queryKeys.calendarEvents.all, 'list'] as const,
    list: (params?: { locationId?: string }) =>
      [...queryKeys.calendarEvents.lists(), params] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.notifications.lists(), userId] as const,
    unreadCount: (userId: string) =>
      [...queryKeys.notifications.all, 'unread-count', userId] as const,
  },

  // Properties
  properties: {
    all: ['properties'] as const,
    lists: () => [...queryKeys.properties.all, 'list'] as const,
    list: (agentId: string, filters?: { locationId?: string; status?: string }) =>
      [...queryKeys.properties.lists(), agentId, filters] as const,
  },

  // Connected accounts
  connectedAccounts: {
    all: ['connected-accounts'] as const,
    lists: () => [...queryKeys.connectedAccounts.all, 'list'] as const,
    list: (agentId: string, locationId?: string) => 
      [...queryKeys.connectedAccounts.lists(), agentId, locationId] as const,
  },

  // Scheduled reports
  scheduledReports: {
    all: ['scheduled-reports'] as const,
    lists: () => [...queryKeys.scheduledReports.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.scheduledReports.lists(), userId] as const,
  },

  // Report exports (export history)
  reportExports: {
    all: ['report-exports'] as const,
    lists: () => [...queryKeys.reportExports.all, 'list'] as const,
    list: (userId: string) => [...queryKeys.reportExports.lists(), userId] as const,
  },

  // Traffic analytics
  trafficAnalytics: {
    all: ['traffic-analytics'] as const,
    data: (params: { startDate: string; endDate: string; accountOwnerId?: string }) =>
      [...queryKeys.trafficAnalytics.all, params] as const,
  },

  // Onboarding progress (computed from other queries)
  onboarding: {
    all: ['onboarding'] as const,
    progress: (userId: string) => [...queryKeys.onboarding.all, 'progress', userId] as const,
  },
} as const;

/** Type helper for query keys */
export type QueryKeys = typeof queryKeys;
