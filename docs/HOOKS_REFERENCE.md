# ChatPad Hooks Reference

> **Last Updated**: December 2025  
> **Status**: Active  
> **Related**: [Architecture](./ARCHITECTURE.md), [Database Schema](./DATABASE_SCHEMA.md)

Complete reference for all custom React hooks in the ChatPad application.

---

## Table of Contents

1. [React Query Infrastructure](#react-query-infrastructure)
2. [Error Handling Convention](#error-handling-convention)
3. [Data Hooks](#data-hooks)
4. [UI & State Hooks](#ui--state-hooks)
4. [Authentication & Security Hooks](#authentication--security-hooks)
5. [Widget Hooks](#widget-hooks)
6. [Usage Patterns](#usage-patterns)

---

## React Query Infrastructure

### Query Keys (`src/lib/query-keys.ts`)

Centralized query key factory for type-safe cache management. All query keys are defined here.

```tsx
import { queryKeys } from '@/lib/query-keys';

// Examples
queryKeys.agent.all           // ['agent'] - Invalidate all agent data
queryKeys.agent.detail(userId) // ['agent', userId] - Specific user's agent

queryKeys.locations.all       // Invalidate all locations
queryKeys.locations.list(agentId) // Locations for specific agent

// Use with React Query
queryClient.invalidateQueries({ queryKey: queryKeys.agent.all });
```

**Available Keys**: `agent`, `profile`, `knowledgeSources`, `locations`, `helpArticles`, `helpCategories`, `announcements`, `newsItems`, `conversations`, `leads`, `team`, `properties`, `webhooks`, `agentTools`, `connectedAccounts`, `calendarEvents`, `analytics`, `notifications`

---

### useSupabaseQuery (`src/hooks/useSupabaseQuery.ts`)

Combines React Query with Supabase real-time subscriptions for automatic cache invalidation.

```tsx
import { useSupabaseQuery, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { queryKeys } from '@/lib/query-keys';

// Query with real-time updates
const { data, isLoading, refetch } = useSupabaseQuery({
  queryKey: queryKeys.locations.list(agentId),
  queryFn: async () => {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('agent_id', agentId);
    return data;
  },
  realtime: {
    table: 'locations',
    filter: `agent_id=eq.${agentId}`,
  },
  enabled: !!agentId,
});

// Mutation with automatic cache invalidation
const mutation = useSupabaseMutation({
  mutationFn: async (data) => { /* ... */ },
  invalidateKeys: [queryKeys.locations.all],
});
```

**Options**:
- `queryKey`: Query key for caching
- `queryFn`: Async function to fetch data
- `realtime`: Optional config for real-time subscription
- `enabled`: Whether to run the query
- All standard React Query options

#### ⚠️ Required Pattern: `enabled` Condition

**CRITICAL**: All `useSupabaseQuery` hooks with realtime subscriptions MUST include proper `enabled` conditions and user-scoped filters to prevent:

1. **Channel Leaks**: Subscriptions created before authentication wastes resources
2. **Global Subscriptions**: Missing filters subscribe to ALL table changes instead of user-specific data
3. **ERR_INSUFFICIENT_RESOURCES**: Supabase connection limits exceeded from orphaned channels

```tsx
// ✅ CORRECT: All three protections in place
const { data, isLoading } = useSupabaseQuery({
  queryKey: queryKeys.leadStages,
  queryFn: async () => {
    if (!user) return [];  // 1. Guard in queryFn
    
    const { data, error } = await supabase
      .from('lead_stages')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  realtime: user ? {
    table: 'lead_stages',
    schema: 'public',
    filter: `user_id=eq.${user.id}`,  // 2. User-scoped filter
  } : undefined,
  enabled: !!user,  // 3. Prevent query/subscription before auth
});

// ❌ WRONG: Missing all protections
const { data } = useSupabaseQuery({
  queryKey: queryKeys.leadStages,
  queryFn: async () => {
    const { data } = await supabase.from('lead_stages').select('*');
    return data;
  },
  realtime: {
    table: 'lead_stages',  // Subscribes to ALL lead_stages globally!
  },
  // No enabled condition - runs immediately!
});
```

**Checklist for new hooks**:
- [ ] `enabled: !!user` (or equivalent condition)
- [ ] Guard in `queryFn`: `if (!user) return []`
- [ ] Conditional `realtime`: `user ? {...} : undefined`
- [ ] User-scoped filter: `filter: \`user_id=eq.${user.id}\``

---

## Error Handling Convention

All hooks use type-safe error handling with `catch (error: unknown)` and the `getErrorMessage()` utility from `src/types/errors.ts`.

```tsx
import { getErrorMessage } from '@/types/errors';

// Standard pattern used in all hooks
const mutation = useMutation({
  mutationFn: async (data) => {
    // ... mutation logic
  },
  onError: (error: unknown) => {
    toast.error('Operation failed', { description: getErrorMessage(error) });
  },
});

// In async operations within hooks
try {
  await supabase.from('table').insert(data);
} catch (error: unknown) {
  console.error('Insert failed:', getErrorMessage(error));
  throw error;
}
```

**See**: [DESIGN_SYSTEM.md#error-handling-pattern](./DESIGN_SYSTEM.md#error-handling-pattern) for full documentation.

---

## Data Hooks

Hooks for fetching and mutating data with React Query and Supabase.

### useAgent

Manages the single Ari agent for the current user (single-agent model).

**Powered by React Query** - Agent data is cached and shared across all components that use this hook. Real-time updates via Supabase subscription automatically invalidate the cache.

```tsx
import { useAgent } from '@/hooks/useAgent';

const { 
  agent,              // Agent | null - The user's Ari agent
  agentId,            // string | null - Agent ID shortcut
  loading,            // boolean - Loading state
  updateAgent,        // (data) => Promise<Agent | null> - Update agent
  updateDeploymentConfig, // (config) => Promise<Agent | null> - Update deployment config
  refetch             // () => void - Trigger background refetch
} = useAgent();
```

**Key Features**:
- Shared cache across 7+ components (no duplicate fetches)
- 5-minute stale time (data considered fresh)
- Real-time updates via Supabase subscription
- Optimistic cache updates on mutations

**File**: `src/hooks/useAgent.ts`

---

### useConversations

Manages chat conversations with real-time updates. **Powered by React Query** with Supabase subscriptions.

```tsx
import { useConversations } from '@/hooks/useConversations';

const {
  conversations,            // Conversation[] - All conversations
  loading,                  // boolean - Loading state
  fetchMessages,            // (conversationId) => Promise<Message[]>
  updateConversationStatus, // (id, status) => Promise - Change status
  updateConversationMetadata, // (id, metadata, options?) => Promise - Update metadata
  takeover,                 // (conversationId, reason?) => Promise - Start takeover
  returnToAI,               // (conversationId) => Promise - End takeover
  sendHumanMessage,         // (conversationId, content, files?) => Promise<boolean>
  reopenConversation,       // (conversationId) => Promise - Reopen closed
  refetch,                  // () => void - Trigger background refetch
} = useConversations();
```

**Key Features**:
- React Query caching with 30-second stale time
- Real-time updates via Supabase subscription on `conversations` table
- Separate subscription for message notifications (plays sound on new user messages)
- Optimistic updates for metadata changes
- Automatic cache invalidation on status changes

**File**: `src/hooks/useConversations.ts`

---

### useConversationMessages

Manages message state and real-time subscriptions for a selected conversation. Extracted in Phase 5 for better separation of concerns.

```tsx
import { useConversationMessages } from '@/hooks/useConversationMessages';

const {
  messages,           // Message[] - All messages for selected conversation
  setMessages,        // Dispatch - Set messages (for optimistic updates)
  loadingMessages,    // boolean - Loading state
  isNewMessage,       // (id: string) => boolean - Check if message is new (for animations)
  newMessageIdsRef,   // Ref - Mutable set of new message IDs
  isInitialLoadRef,   // Ref - Track initial load state
} = useConversationMessages({
  conversationId: string | null,
  fetchMessages: (conversationId: string) => Promise<Message[]>,
});
```

**Key Features**:
- Real-time message updates via Supabase subscription
- Automatic scroll-to-bottom on new messages
- Animation tracking for new messages
- Cleans up subscription on unmount

**File**: `src/hooks/useConversationMessages.ts`

---

### useTypingPresence

Handles admin typing indicator broadcasting via Supabase Presence. Extracted in Phase 5.

```tsx
import { useTypingPresence } from '@/hooks/useTypingPresence';

const {
  handleTyping,         // () => void - Call on keystroke
  stopTypingIndicator,  // () => void - Call on send/blur
} = useTypingPresence({
  conversation: Conversation | null,
  userId: string | null | undefined,
  userEmail: string | null | undefined,
});
```

**Key Features**:
- Debounced typing broadcast (500ms)
- Auto-stop after 3 seconds of inactivity
- Cleans up presence channel on unmount

**File**: `src/hooks/useTypingPresence.ts`

---

### useVisitorPresence

Tracks visitor online/offline status via Supabase Presence. Used in admin inbox to show active visitors. Extracted in Phase 5.

```tsx
import { useVisitorPresence, type VisitorPresenceData } from '@/hooks/useVisitorPresence';

const {
  activeVisitors,      // Record<string, VisitorPresenceData> - Map of active visitors
  getVisitorPresence,  // (visitorId: string) => VisitorPresenceData | null
} = useVisitorPresence({
  agentId: string | null | undefined,
});
```

**VisitorPresenceData**:
```typescript
interface VisitorPresenceData {
  visitorId: string;
  currentPage: string;
}
```

**Key Features**:
- Real-time presence tracking
- Efficient Map-based lookup
- Automatic cleanup on unmount

**File**: `src/hooks/useVisitorPresence.ts`

---

### useLeads

Manages leads captured from widget contact forms. **Powered by React Query** with real-time updates.

```tsx
import { useLeads } from '@/hooks/useLeads';

const {
  leads,                    // Lead[] - All leads with linked conversations
  loading,                  // boolean - Loading state
  createLead,               // (leadData) => Promise<Lead> - Create lead
  updateLead,               // (id, updates) => Promise - Update lead
  updateLeadOrders,         // (updates[]) => Promise - Batch update kanban order
  deleteLead,               // (id, deleteConversation?) => Promise - Delete lead
  deleteLeads,              // (ids[], deleteConversations?) => Promise - Bulk delete
  getLeadsWithConversations, // (ids[]) => boolean - Check for linked conversations
  refetch,                  // () => void - Trigger background refetch
} = useLeads();
```

**Key Features**:
- React Query caching with 30-second stale time
- Real-time updates via Supabase subscription on `leads` table
- Optimistic updates for kanban drag-and-drop reordering
- Automatic cache invalidation on mutations
- Cleans up related data (memories, calendar events) on delete

**File**: `src/hooks/useLeads.ts`

---

### useLeadStages

Manages custom lead pipeline stages with drag-and-drop reordering. **Powered by React Query** with real-time updates.

```tsx
import { useLeadStages } from '@/hooks/useLeadStages';

const {
  stages,             // LeadStage[] - All stages sorted by order_index
  loading,            // boolean - Loading state
  createStage,        // (name, color?) => Promise<LeadStage> - Create stage
  updateStage,        // (id, updates) => Promise - Update name/color/default
  deleteStage,        // (id) => Promise<boolean> - Delete (checks lead count)
  reorderStages,      // (orderedIds[]) => Promise - Reorder stages
  getLeadCountByStage, // (stageId) => Promise<number> - Get lead count
  refetch,            // () => void - Trigger background refetch
} = useLeadStages();
```

**LeadStage Interface**:
```typescript
interface LeadStage {
  id: string;
  user_id: string;
  name: string;
  color: string;          // Hex color for stage badge
  order_index: number;    // Display order (0-based)
  is_default: boolean;    // Default stage for new leads
  created_at: string;
  updated_at: string;
}
```

**Key Features**:
- React Query caching with real-time updates
- Auto-seeds default stages (New, Contacted, Qualified, Converted) on first use
- Prevents deletion of stages with active leads
- Single default stage enforcement (auto-unsets previous default)
- Integrates with `LeadsKanbanBoard` for drag-and-drop

**File**: `src/hooks/useLeadStages.ts`

---

### useKnowledgeSources

Manages knowledge sources for RAG. **Powered by React Query** with real-time updates.

```tsx
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';

const {
  sources,              // KnowledgeSource[] - All sources
  loading,              // boolean
  uploadDocument,       // (file, agentId, userId) => Promise<string | null>
  addUrlSource,         // (url, agentId, userId, options?) => Promise<string | null>
  addSitemapSource,     // (url, agentId, userId, options?) => Promise<string | null>
  addTextSource,        // (content, agentId, userId, type?, metadata?) => Promise<string | null>
  addPropertyListingSource, // (url, agentId, userId, options?) => Promise<string | null>
  deleteSource,         // (id) => Promise
  deleteChildSource,    // (id) => Promise - Delete sitemap child
  reprocessSource,      // (id) => Promise
  resumeProcessing,     // (id) => Promise
  retryChildSource,     // (id) => Promise
  retrainAllSources,    // (onProgress?) => Promise<{success, failed}>
  triggerManualRefresh, // (id) => Promise
  isSourceOutdated,     // (source) => boolean
  getChildSources,      // (parentId) => KnowledgeSource[]
  getParentSources,     // () => KnowledgeSource[]
  refetch,              // () => void
} = useKnowledgeSources(agentId?: string);
```

**Key Features**:
- React Query caching with 2-minute stale time
- Real-time updates via Supabase subscription
- Optimistic updates for mutations

**File**: `src/hooks/useKnowledgeSources.ts`

---

### useLocations

Manages locations (communities/properties/sites). **Powered by React Query** with real-time updates.

```tsx
import { useLocations } from '@/hooks/useLocations';

const {
  locations,        // Location[] - All locations
  loading,          // boolean
  createLocation,   // (formData, userId) => Promise<string | null>
  updateLocation,   // (id, formData) => Promise<boolean>
  deleteLocation,   // (id) => Promise<boolean>
  getBusinessHours, // (location) => BusinessHours
  refetch,          // () => void
} = useLocations(agentId?: string);
```

**Key Features**:
- React Query caching with 2-minute stale time
- Real-time updates via Supabase subscription
- Hard deletes (permanent removal)

**File**: `src/hooks/useLocations.ts`

---

### useHelpArticles

Manages help center articles and categories. **Powered by React Query** with real-time updates.

```tsx
import { useHelpArticles } from '@/hooks/useHelpArticles';

const {
  articles,          // HelpArticle[] - All articles
  categories,        // HelpCategory[] - All categories
  loading,           // boolean
  addArticle,        // (data) => Promise<string>
  updateArticle,     // (id, updates) => Promise
  deleteArticle,     // (id) => Promise
  reorderArticles,   // (reorderedArticles) => Promise
  addCategory,       // (name, description?, icon?) => Promise<string>
  updateCategory,    // (oldName, newName, description?, icon?) => Promise
  removeCategory,    // (name, options?) => Promise
  moveArticleToCategory, // (articleId, targetCategory) => Promise
  bulkImport,        // (importData) => Promise<number>
  embedAllArticles,  // (onProgress?) => Promise<number>
  refetch,           // () => void
} = useHelpArticles(agentId: string);
```

**Key Features**:
- React Query caching with 2-minute stale time
- Real-time updates via Supabase subscription
- Automatic embedding generation for RAG

**File**: `src/hooks/useHelpArticles.ts`

---

### useAnnouncements

Manages widget announcement banners. **Powered by React Query** with real-time updates.

```tsx
import { useAnnouncements } from '@/hooks/useAnnouncements';

const {
  announcements,          // Announcement[] - All announcements
  loading,                // boolean
  addAnnouncement,        // (data) => Promise<Announcement>
  updateAnnouncement,     // (id, updates) => Promise<Announcement>
  deleteAnnouncement,     // (id) => Promise
  reorderAnnouncements,   // (reorderedAnnouncements) => Promise
  refetch,                // () => void
} = useAnnouncements(agentId: string);
```

**Key Features**:
- React Query caching with 2-minute stale time
- Real-time updates via Supabase subscription
- Automatic image cleanup on delete

**File**: `src/hooks/useAnnouncements.ts`

---

### useNewsItems

Manages widget news/updates feed. **Powered by React Query** with real-time updates.

```tsx
import { useNewsItems } from '@/hooks/useNewsItems';

const {
  newsItems,          // NewsItem[] - All news items
  loading,            // boolean
  addNewsItem,        // (data) => Promise<NewsItem>
  updateNewsItem,     // (id, updates) => Promise<NewsItem>
  deleteNewsItem,     // (id) => Promise
  reorderNewsItems,   // (reorderedItems) => Promise
  refetch,            // () => void
} = useNewsItems(agentId: string);
```

**Key Features**:
- React Query caching with 2-minute stale time
- Real-time updates via Supabase subscription
- Automatic image cleanup on delete

**File**: `src/hooks/useNewsItems.ts`

---

### useCalendarEvents

Manages calendar events for booking/scheduling. **Powered by React Query** with real-time updates.

```tsx
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

const {
  events,           // CalendarEvent[] - All calendar events
  isLoading,        // boolean - Loading state
  refetch,          // () => void - Trigger background refetch
  invalidateEvents, // () => Promise<void> - Invalidate cache
  cancelEvent,      // (eventId: string, reason?: string) => Promise<boolean>
  completeEvent,    // (eventId: string) => Promise<boolean>
  rescheduleEvent,  // (eventId: string, newStart: Date, newEnd: Date, reason?: string) => Promise<boolean>
} = useCalendarEvents(options?: UseCalendarEventsOptions);
```

**Options:**
```typescript
interface UseCalendarEventsOptions {
  agentId?: string;       // Filter by agent
  locationId?: string;    // Filter by location
  startDate?: Date;       // Filter events after date
  endDate?: Date;         // Filter events before date
  status?: string;        // Filter by status
}
```

**CalendarEvent Interface:**
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  visitorName: string | null;
  visitorEmail: string | null;
  visitorPhone: string | null;
  locationId: string | null;
  connectedAccountId: string;
  externalEventId: string | null;
  notes: string | null;
  metadata: Record<string, any> | null;
}
```

**Key Features:**
- React Query caching with real-time updates
- Supports filtering by agent, location, date range, and status
- CRUD operations for event management
- Integrates with connected calendar accounts

**File**: `src/hooks/useCalendarEvents.ts`

---

### useConnectedAccounts

Manages OAuth connected accounts (Google Calendar, Outlook Calendar). **Powered by React Query** with real-time updates.

```tsx
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';

const {
  accounts,           // ConnectedAccount[] - All connected accounts
  loading,            // boolean - Loading state
  disconnectAccount,  // (accountId: string) => Promise<boolean>
  refreshTokens,      // (accountId: string) => Promise<boolean>
  refetch,            // () => void - Trigger background refetch
} = useConnectedAccounts(locationId?: string, agentId?: string);
```

**ConnectedAccount Interface:**
```typescript
interface ConnectedAccount {
  id: string;
  location_id: string | null;
  agent_id: string;
  user_id: string;
  provider: 'google_calendar' | 'outlook_calendar';
  account_email: string;
  calendar_id: string | null;
  calendar_name: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  sync_error: string | null;
  webhook_channel_id: string | null;
  webhook_resource_id: string | null;
  webhook_expires_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**Key Features:**
- React Query caching with 1-minute stale time
- Real-time updates via Supabase subscription
- OAuth token refresh support
- Webhook subscription tracking

**File**: `src/hooks/useConnectedAccounts.ts`

---

### useProperties

Manages property listings with location enrichment and validation statistics. **Powered by React Query** with real-time updates.

```tsx
import { useProperties } from '@/hooks/useProperties';

const {
  properties,              // Property[] - Raw properties
  propertiesWithLocation,  // PropertyWithLocation[] - Properties with location data
  uniqueLocations,         // LocationOption[] - Unique location options
  validationStats,         // ValidationStats - Data quality metrics
  propertyCounts,          // Map<string, number> - Count by location
  loading,                 // boolean - Loading state
  getPropertyCount,        // (locationName: string) => number
  refetch,                 // () => void - Trigger background refetch
} = useProperties(agentId?: string);
```

**Key Interfaces:**
```typescript
interface PropertyWithLocation {
  id: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  status: 'available' | 'pending' | 'sold' | 'off_market' | null;
  locationName: string | null;
  locationId: string | null;
}

interface ValidationStats {
  total: number;
  withPrice: number;
  withAddress: number;
  withLocation: number;
  pricePercentage: number;
  addressPercentage: number;
  locationPercentage: number;
}
```

**Key Features:**
- React Query caching with real-time updates
- Enriches properties with location names
- Calculates data quality validation statistics
- Groups properties by location for counts

**File**: `src/hooks/useProperties.ts`

---

### useWordPressConnection

Manages WordPress API connection, testing, and community synchronization.

```tsx
import { useWordPressConnection } from '@/hooks/useWordPressConnection';

const {
  siteUrl,             // string | null - Configured WordPress URL
  communityEndpoint,   // string | null - Community API endpoint
  homeEndpoint,        // string | null - Home API endpoint
  isConnected,         // boolean - Whether WordPress is connected
  syncInterval,        // SyncInterval - Current sync interval
  homeSyncInterval,    // SyncInterval - Home sync interval
  lastSynced,          // Date | null - Last sync timestamp
  communityCount,      // number - Number of synced communities
  homeCount,           // number - Number of synced homes
  
  // State
  isTesting,           // boolean - Connection test in progress
  isSyncing,           // boolean - Sync in progress
  isSaving,            // boolean - Save in progress
  isDiscovering,       // boolean - Endpoint discovery in progress
  testResult,          // TestResult | null - Last test result
  discoveredEndpoints, // DiscoveredEndpoints | null - Found endpoints
  
  // Actions
  discoverEndpoints,   // (url: string) => Promise<DiscoveredEndpoints | null>
  testConnection,      // (url: string, endpoint?: string) => Promise<TestResult>
  saveUrl,             // (url: string) => Promise<boolean>
  saveConfig,          // (url: string) => Promise<boolean>
  importCommunities,   // (url?: string, endpoint?: string) => Promise<SyncResult>
  updateEndpoint,      // (type: 'community' | 'home', endpoint: string) => Promise<boolean>
  updateSyncInterval,  // (type: 'community' | 'home', interval: string) => Promise<boolean>
  disconnect,          // (deleteLocations?: boolean) => Promise<boolean>
  clearTestResult,     // () => void
} = useWordPressConnection({ agent, onSyncComplete? });
```

**Key Features:**
- Tests WordPress REST API connectivity
- Discovers available community/home endpoints
- Imports communities as locations
- Configurable sync intervals
- Stores config in agent's deployment_config

**File**: `src/hooks/useWordPressConnection.ts`

---

### useWordPressHomes

Manages WordPress home/property data synchronization.

```tsx
import { useWordPressHomes } from '@/hooks/useWordPressHomes';

const {
  siteUrl,              // string | null - Configured WordPress URL
  homeEndpoint,         // string | null - Home API endpoint
  isConnected,          // boolean - Whether WordPress homes are connected
  
  // State
  isTesting,            // boolean - Test in progress
  isSyncing,            // boolean - Sync in progress
  testResult,           // TestResult | null - Last test result
  
  // Actions
  testHomesEndpoint,    // (url: string, endpoint?: string) => Promise<TestResult>
  syncHomes,            // (url?: string, useAiExtraction?: boolean, endpoint?: string) => Promise<SyncResult>
  clearTestResult,      // () => void
} = useWordPressHomes({ agent, onSyncComplete? });
```

**TestResult Interface:**
```typescript
interface TestResult {
  success: boolean;
  message: string;
  homeCount?: number;
  sampleData?: any;
}
```

**SyncResult Interface:**
```typescript
interface SyncResult {
  success: boolean;
  message: string;
  created?: number;
  updated?: number;
  failed?: number;
}
```

**Key Features:**
- Tests WordPress homes endpoint connectivity
- Syncs home listings as properties
- Optional AI extraction for complex data
- Integrates with knowledge sources for RAG

**File**: `src/hooks/useWordPressHomes.ts`

---

### useWebhooks

**Powered by React Query** - Webhook data is cached and real-time updates via Supabase subscription automatically invalidate the cache.

```tsx
import { useWebhooks } from '@/hooks/useWebhooks';

const {
  webhooks,        // Webhook[] - All webhooks
  logs,           // WebhookLog[] - Delivery logs
  loading,        // boolean
  createWebhook,  // (data) => Promise
  updateWebhook,  // (id, data) => Promise
  deleteWebhook,  // (id) => Promise
  testWebhook,    // (id) => Promise
  fetchLogs,      // (webhookId?) => Promise
  refetch,        // () => void
} = useWebhooks(agentId: string);
```

**File**: `src/hooks/useWebhooks.ts`

---

### useTeam

**Powered by React Query** - Team data is cached and real-time updates via Supabase subscription automatically invalidate the cache.

```tsx
import { useTeam } from '@/hooks/useTeam';

const {
  teamMembers,       // TeamMember[] - All team members with roles
  loading,           // boolean
  currentUserRole,   // UserRole - Current user's role
  canManageRoles,    // boolean - Whether user can manage roles
  inviteMember,      // (data) => Promise<boolean>
  updateMemberRole,  // (member, role, permissions) => Promise<boolean>
  removeMember,      // (member) => Promise<boolean>
  fetchTeamMembers,  // () => void - Alias for refetch
} = useTeam();
```

**File**: `src/hooks/useTeam.ts`

---

### useAnalytics

Fetches general analytics data including conversations, leads, and usage metrics.

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

const {
  conversationStats, // ConversationStats[] - Daily conversation statistics
  leadStats,         // LeadStageStats[] - Daily lead statistics by stage
  stageInfo,         // StageInfo[] - Stage metadata for chart colors
  agentPerformance,  // AgentPerformance[] - Ari performance metrics
  usageMetrics,      // UsageMetrics[] - Daily usage metrics
  conversations,     // any[] - Raw conversation data for tables
  leads,             // any[] - Raw lead data for tables
  loading,           // boolean - Loading state
  refetch,           // () => void - Manually refresh all analytics
} = useAnalytics(startDate: Date, endDate: Date, filters: AnalyticsFilters);
```

**File**: `src/hooks/useAnalytics.ts`

---

### useBookingAnalytics

Fetches booking/appointment analytics from calendar events. **Powered by React Query** with real-time updates.

```tsx
import { useBookingAnalytics } from '@/hooks/useBookingAnalytics';

const {
  stats,       // BookingStats | null - Computed booking statistics
  rawEvents,   // RawCalendarEvent[] - Raw calendar events
  loading,     // boolean - Loading state
  refetch,     // () => void - Manually trigger refetch
  invalidate,  // () => void - Invalidate cache
} = useBookingAnalytics(startDate: Date, endDate: Date);
```

**BookingStats Interface:**
```typescript
interface BookingStats {
  totalBookings: number;           // Total bookings in period
  showRate: number;                // Percentage of completed bookings (0-100)
  byLocation: LocationBookingData[]; // Bookings grouped by location
  byStatus: BookingStatusData[];   // Bookings grouped by status
  trend: BookingTrendData[];       // Daily booking trend
}
```

**Key Features:**
- Filters by user's connected calendar accounts
- Groups bookings by location with completion stats
- Calculates show rate: completed / (completed + cancelled + no_show)
- Generates daily trend data for sparklines
- Real-time updates via Supabase subscription

**File**: `src/hooks/useBookingAnalytics.ts`

---

### useSatisfactionAnalytics

Fetches customer satisfaction analytics from conversation ratings. **Powered by React Query** with real-time updates.

```tsx
import { useSatisfactionAnalytics } from '@/hooks/useSatisfactionAnalytics';

const {
  stats,       // SatisfactionStats | null - Computed satisfaction statistics
  rawRatings,  // RawRating[] - Raw rating records
  loading,     // boolean - Loading state
  refetch,     // () => void - Manually trigger refetch
  invalidate,  // () => void - Invalidate cache
} = useSatisfactionAnalytics(startDate: Date, endDate: Date);
```

**SatisfactionStats Interface:**
```typescript
interface SatisfactionStats {
  averageRating: number;           // Average rating (1-5 scale)
  totalRatings: number;            // Total ratings submitted
  distribution: RatingDistribution[]; // Count per 1-5 star
  trend: SatisfactionTrendData[];  // Daily average rating trend
  recentFeedback: FeedbackItem[];  // Recent ratings with comments
}
```

**Key Features:**
- Filters by user's conversations in date range
- Calculates distribution across 1-5 star ratings
- Generates daily average trend data
- Extracts recent feedback with comments (limit 10)
- Real-time updates via Supabase subscription

**File**: `src/hooks/useSatisfactionAnalytics.ts`

---

### useAIPerformanceAnalytics

Fetches AI performance metrics including containment and resolution rates. **Powered by React Query** with real-time updates.

```tsx
import { useAIPerformanceAnalytics } from '@/hooks/useAIPerformanceAnalytics';

const {
  stats,            // AIPerformanceStats | null - Performance metrics
  trend,            // AIPerformanceTrendData[] - Daily trend data
  rawConversations, // RawConversation[] - Raw conversation records
  loading,          // boolean - Loading state
  refetch,          // () => void - Manually trigger refetch
  invalidate,       // () => void - Invalidate cache
} = useAIPerformanceAnalytics(startDate: Date, endDate: Date);
```

**AIPerformanceStats Interface:**
```typescript
interface AIPerformanceStats {
  containmentRate: number;    // % handled by AI without human (0-100)
  resolutionRate: number;     // % of conversations closed (0-100)
  totalConversations: number; // Total in period
  aiHandled: number;          // Handled entirely by AI
  humanTakeover: number;      // Required human intervention
  closed: number;             // Closed conversations
  active: number;             // Active conversations
}
```

**Key Features:**
- Containment Rate = (total - takeovers) / total * 100
- Resolution Rate = closed / total * 100
- Tracks both current status and historical takeovers
- Generates daily trend data for sparklines
- Real-time updates via Supabase subscription

**File**: `src/hooks/useAIPerformanceAnalytics.ts`

---

### useAnalyticsData

Consolidated hook for all analytics data fetching and calculations. Combines 6 data hooks into a single interface for the Analytics page.

**Production Readiness (Verified December 2025 - All 7 Phases Complete):**
- ✅ Phase 1: All analytics types centralized in `src/types/analytics.ts`
- ✅ Phase 2: ARIA labels on all interactive elements, grid roles on heatmaps
- ✅ Phase 3: Date formatting utilities consolidated in `src/lib/formatting-utils.ts`
- ✅ Phase 4: Loading states standardized to use `loading` prop naming
- ✅ Phase 5: All chart components have consistent loading skeletons with aria-labels
- ✅ Phase 6: Documentation updated with full hook signatures
- ✅ Phase 7: Final validation complete - no type errors, no raw Tailwind colors, no Lucide icons

```tsx
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

const {
  // === Raw Data ===
  conversationStats,          // ConversationStats | null
  leadStats,                  // LeadStageStats | null
  stageInfo,                  // StageInfo[]
  agentPerformance,           // AgentPerformance | null
  usageMetrics,               // UsageMetrics | null
  bookingStats,               // BookingStats | null
  satisfactionStats,          // SatisfactionStats | null
  aiPerformanceStats,         // AIPerformanceStats | null
  trafficSources,             // TrafficSourceData[]
  landingPages,               // LandingPageData[]
  locationData,               // LocationData[]
  
  // === Comparison Data ===
  comparisonConversationStats, // ConversationStats | null
  comparisonLeadStats,         // LeadStageStats | null
  comparisonBookingStats,      // BookingStats | null
  comparisonTrafficSources,    // TrafficSourceData[]
  
  // === Funnel ===
  funnelStages,               // FunnelStage[]
  funnelLoading,              // boolean
  
  // === Loading States ===
  loading,                    // boolean - General loading
  bookingLoading,             // boolean
  satisfactionLoading,        // boolean
  aiPerformanceLoading,       // boolean
  trafficLoading,             // boolean
  comparisonTrafficLoading,   // boolean
  
  // === Calculated KPIs ===
  totalConversations,         // number
  totalLeads,                 // number
  conversionRate,             // string (e.g. "12.5%")
  totalBookings,              // number
  totalMessages,              // number
  
  // === Trend Values ===
  conversationTrendValue,     // number (percentage change)
  leadTrendValue,             // number
  bookingTrendValue,          // number
  aiContainmentTrendValue,    // number
  
  // === Chart Data (processed) ===
  leadChartData,              // { value: number }[]
  conversionChartData,        // { value: number }[]
  bookingChartData,           // { value: number }[]
  leadTrend,                  // number[]
  conversionTrend,            // number[]
  bookingTrend,               // number[]
  
  // === Utility Functions ===
  calculatePeriodChange,      // (trend: number[]) => number
  calculatePointChange,       // (trend: number[]) => number
  
  // === Mock Mode ===
  mockMode,                   // boolean
  setMockMode,                // (enabled: boolean) => void
  regenerateMockData,         // () => void
  
  // === Actions ===
  refetch,                    // () => void
} = useAnalyticsData({
  startDate: Date,
  endDate: Date,
  comparisonStartDate: Date,
  comparisonEndDate: Date,
  comparisonMode: boolean,
  filters: { leadStatus: string, conversationStatus: string },
});
```

**Key Features:**
- Consolidates 6 data hooks: `useAnalytics`, `useBookingAnalytics`, `useSatisfactionAnalytics`, `useAIPerformanceAnalytics`, `useTrafficAnalytics`, `useConversationFunnel`
- Single mock mode toggle affecting all data sources
- Pre-calculated KPIs and trend values
- Chart-ready data transformations
- Comparison mode support for A/B period analysis

**File**: `src/hooks/useAnalyticsData.ts`

---

### useTrafficAnalytics

Fetches visitor traffic, page analytics, engagement metrics, and session depth data. **Powered by React Query** with real-time updates.

**Type Consolidation (Verified December 2025)**: All traffic analytics types (`EngagementMetrics`, `DailySourceData`, `PageDepthData`, `LocationData`) are now centralized in `src/types/analytics.ts`. The hook re-exports these for backwards compatibility.

```tsx
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';

const {
  trafficSources,          // TrafficSourceData[] - Referrer breakdown
  landingPages,            // LandingPageData[] - Top landing pages
  pageVisits,              // PageVisitData[] - Page visit data
  locationData,            // LocationData[] - Visitor locations with coordinates
  engagement,              // EngagementMetrics - Bounce rate, CVR, session depth
  sourcesByDate,           // DailySourceData[] - Daily traffic source breakdown
  pageDepthDistribution,   // PageDepthData[] - Session depth distribution
  leadsBySource,           // LeadSourceData[] - Leads per traffic source
  loading,                 // boolean
  agentId,                 // string | null
  refetch,                 // () => void
} = useTrafficAnalytics(startDate: Date, endDate: Date);
```

**File**: `src/hooks/useTrafficAnalytics.ts`

---

### useNotifications

Manages notification data and actions.

```tsx
import { useNotifications } from '@/hooks/useNotifications';

const {
  notifications,     // Notification[] - All notifications
  unreadCount,      // number - Unread count
  isLoading,        // boolean
  markAsRead,       // (id) => Promise
  markAllAsRead,    // () => Promise
  deleteNotification, // (id) => Promise
} = useNotifications();
```

**File**: `src/hooks/useNotifications.ts`


### useAgentApiKeys

Manages API keys for agent access.

```tsx
import { useAgentApiKeys } from '@/hooks/useAgentApiKeys';

const {
  apiKeys,          // ApiKey[] - All API keys
  isLoading,       // boolean
  createKey,       // (name, limits) => Promise<{ key }> - Returns raw key once
  revokeKey,       // (id) => Promise
  updateLimits,    // (id, limits) => Promise
} = useAgentApiKeys(agentId: string);
```

**File**: `src/hooks/useAgentApiKeys.ts`

---

### usePlanLimits

Fetches current plan limits and usage.

```tsx
import { usePlanLimits } from '@/hooks/usePlanLimits';

const {
  limits,           // PlanLimits - Current limits
  usage,           // Usage - Current usage
  isLoading,       // boolean
  isAtLimit,       // (resource) => boolean
  getPercentUsed,  // (resource) => number
} = usePlanLimits();
```

**File**: `src/hooks/usePlanLimits.ts`

---

## UI & State Hooks

Hooks for UI state management and interactions.

### useSidebar

Controls sidebar expansion state.

```tsx
import { useSidebar } from '@/hooks/use-sidebar';

const {
  isOpen,        // boolean - Sidebar open state
  toggle,        // () => void - Toggle open/closed
  open,          // () => void - Force open
  close,         // () => void - Force close
} = useSidebar();
```

**File**: `src/hooks/use-sidebar.ts`

---

### useMobile

Detects mobile viewport.

```tsx
import { useMobile } from '@/hooks/use-mobile';

const isMobile = useMobile(); // boolean - true if viewport < 768px
```

**File**: `src/hooks/use-mobile.tsx`

---

---

### useReducedMotion

Respects user's reduced motion preference.

```tsx
import { useReducedMotion } from '@/hooks/useReducedMotion';

const prefersReducedMotion = useReducedMotion(); // boolean
```

**Usage**:
```tsx
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
/>
```

**File**: `src/hooks/useReducedMotion.ts`

---

### useAutoResizeTextarea

Auto-resizes textarea based on content.

```tsx
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';

const textareaRef = useAutoResizeTextarea(value, maxHeight);

<textarea ref={textareaRef} value={value} onChange={...} />
```

**Parameters**:
- `value: string` - Current textarea value
- `maxHeight?: number` - Maximum height in pixels (default: 200)

**File**: `src/hooks/useAutoResizeTextarea.ts`

---

### useControlledState

Manages controlled/uncontrolled component state.

```tsx
import { useControlledState } from '@/hooks/use-controlled-state';

const [value, setValue] = useControlledState({
  prop: externalValue,      // External controlled value
  defaultProp: defaultValue, // Default for uncontrolled
  onChange: handleChange,   // Callback when value changes
});
```

**File**: `src/hooks/use-controlled-state.ts`

---

### useKeyboardShortcuts

Registers global keyboard shortcuts.

```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

useKeyboardShortcuts({
  'cmd+k': () => openSearch(),
  'cmd+n': () => createNew(),
  'escape': () => closeModal(),
});
```

**File**: `src/hooks/useKeyboardShortcuts.ts`

---

### useCalendarKeyboardShortcuts

Calendar-specific keyboard navigation.

```tsx
import { useCalendarKeyboardShortcuts } from '@/hooks/useCalendarKeyboardShortcuts';

useCalendarKeyboardShortcuts({
  onPrevious: () => goToPrevious(),
  onNext: () => goToNext(),
  onToday: () => goToToday(),
  onViewChange: (view) => setView(view),
});
```

**Shortcuts**:
- `←` / `→` - Previous/Next period
- `T` - Go to today
- `M` / `W` / `D` - Month/Week/Day view

**File**: `src/hooks/useCalendarKeyboardShortcuts.ts`

---

### useGlobalSearch

Global search across all entities.

```tsx
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

const {
  query,           // string - Search query
  setQuery,        // (query) => void
  results,         // SearchResult[] - Matching results
  isSearching,     // boolean
  selectedIndex,   // number - Keyboard navigation index
  selectNext,      // () => void
  selectPrevious,  // () => void
} = useGlobalSearch();
```

**File**: `src/hooks/useGlobalSearch.ts`

---

### useSearchData

Provides searchable data for global search.

```tsx
import { useSearchData } from '@/hooks/useSearchData';

const searchableItems = useSearchData();
// Returns: SearchableItem[] with agents, conversations, leads, settings
```

**File**: `src/hooks/useSearchData.ts`

---

### useEmbeddedChatConfig

Manages widget embed configuration state.

```tsx
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';

const {
  config,        // EmbedConfig - Current configuration
  updateConfig,  // (partial) => void - Update config fields
  resetConfig,   // () => void - Reset to defaults
  generateCode,  // () => string - Generate embed code
} = useEmbeddedChatConfig(agentId: string);
```

**File**: `src/hooks/useEmbeddedChatConfig.ts`

---

## Authentication & Security Hooks

Hooks for authentication and authorization.

### useAuth

Core authentication hook from AuthContext.

```tsx
import { useAuth } from '@/hooks/useAuth';

const {
  user,            // User | null - Current user
  session,         // Session | null - Current session
  isLoading,       // boolean - Auth loading state
  signIn,          // (email, password) => Promise
  signUp,          // (email, password) => Promise
  signOut,         // () => Promise
  resetPassword,   // (email) => Promise
} = useAuth();
```

**File**: `src/hooks/useAuth.ts`

---

### useRoleAuthorization

Role-based access control.

```tsx
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';

const {
  role,              // AppRole - Current user's role
  permissions,       // Permission[] - Current permissions
  hasPermission,     // (permission) => boolean
  isAdmin,           // boolean
  isSuperAdmin,      // boolean
  canManageTeam,     // boolean
  canManageAgents,   // boolean
} = useRoleAuthorization();
```

**Roles**: `super_admin` > `admin` > `manager` > `member` > `client`

**File**: `src/hooks/useRoleAuthorization.ts`

---

### useSecurityLog

Logs security-relevant events.

```tsx
import { useSecurityLog } from '@/hooks/useSecurityLog';

const { logEvent } = useSecurityLog();

await logEvent({
  action: 'api_key_created',
  resourceType: 'agent',
  resourceId: agentId,
  details: { keyName: 'Production Key' },
});
```

**File**: `src/hooks/useSecurityLog.ts`

---

## Widget Hooks

Hooks used within the embedded chat widget (`src/widget/hooks/`).

### useWidgetConfig

Fetches agent configuration for widget.

```tsx
import { useWidgetConfig } from '@/widget/hooks/useWidgetConfig';

const {
  config,       // WidgetConfig | null
  isLoading,   // boolean
  error,       // Error | null
} = useWidgetConfig(agentId: string);
```

**File**: `src/widget/hooks/useWidgetConfig.ts`

---

### useWidgetConversations

Manages widget conversations.

```tsx
import { useWidgetConversations } from '@/widget/hooks/useWidgetConversations';

const {
  conversations,         // Conversation[]
  currentConversation,   // Conversation | null
  createConversation,    // () => Promise<Conversation>
  selectConversation,    // (id) => void
} = useWidgetConversations(agentId: string);
```

**File**: `src/widget/hooks/useWidgetConversations.ts`

---

### useRealtimeMessages

Real-time message subscription for widget.

```tsx
import { useRealtimeMessages } from '@/widget/hooks/useRealtimeMessages';

const messages = useRealtimeMessages(conversationId: string);
// Returns: Message[] - Auto-updates in real-time
```

**File**: `src/widget/hooks/useRealtimeMessages.ts`

---

### useRealtimeConfig

Real-time config updates for widget.

```tsx
import { useRealtimeConfig } from '@/widget/hooks/useRealtimeConfig';

const config = useRealtimeConfig(agentId: string, initialConfig: WidgetConfig);
// Returns: WidgetConfig - Auto-updates when admin changes settings
```

**File**: `src/widget/hooks/useRealtimeConfig.ts`

---

### useConversationStatus

Tracks conversation status changes.

```tsx
import { useConversationStatus } from '@/widget/hooks/useConversationStatus';

const {
  status,        // 'active' | 'human_takeover' | 'closed'
  isHumanMode,   // boolean - True if human takeover
} = useConversationStatus(conversationId: string);
```

**File**: `src/widget/hooks/useConversationStatus.ts`

---

### useTypingIndicator

Manages typing indicator state.

```tsx
import { useTypingIndicator } from '@/widget/hooks/useTypingIndicator';

const {
  isTyping,       // boolean - Is other party typing
  typingUser,     // string | null - Name of typing user
  setTyping,      // (isTyping) => void - Set own typing state
} = useTypingIndicator(conversationId: string, userId: string);
```

**File**: `src/widget/hooks/useTypingIndicator.ts`

---

### useKeyboardHeight

Handles mobile keyboard viewport adjustments.

```tsx
import { useKeyboardHeight } from '@/widget/hooks/useKeyboardHeight';

const {
  keyboardHeight, // number - Keyboard height in pixels
  isKeyboardOpen, // boolean - Is keyboard visible
} = useKeyboardHeight();
```

**Usage**: Adjust container height to prevent keyboard pushing content.

**File**: `src/widget/hooks/useKeyboardHeight.ts`

---

### useVisitorAnalytics

Tracks visitor behavior for analytics.

```tsx
import { useVisitorAnalytics } from '@/widget/hooks/useVisitorAnalytics';

useVisitorAnalytics(agentId: string, conversationId: string);
// Tracks: page visits, time on page, referrer, device info
```

**File**: `src/widget/hooks/useVisitorAnalytics.ts`

---

### useVisitorPresence

Manages visitor online presence.

```tsx
import { useVisitorPresence } from '@/widget/hooks/useVisitorPresence';

useVisitorPresence(agentId: string, visitorId: string);
// Reports: online/offline status to Supabase Presence
```

**File**: `src/widget/hooks/useVisitorPresence.ts`

---

### useLocationDetection

Auto-detects location context from URL patterns for multi-location agents.

```tsx
import { useLocationDetection } from '@/widget/hooks/useLocationDetection';

const {
  location,           // DetectedLocation | null - Detected location
  detectionMethod,    // string - How location was detected
  isDetecting,        // boolean - Detection in progress
  availableLocations, // Location[] - All available locations
  showLocationPicker, // boolean - Should show manual picker
  setShowLocationPicker, // (show) => void
  selectLocation,     // (location) => void - Manual selection
} = useLocationDetection({
  agentId: string,
  wordpressSiteUrl?: string,
  explicitLocationSlug?: string,
  parentPageUrl?: string,
  enableAutoDetection?: boolean,
});
```

**Detection Priority:**
1. Explicit `data-location` attribute on widget script
2. URL pattern matching (e.g., `/communities/[slug]`)
3. WordPress API lookup for community associations
4. Previously selected location from localStorage
5. Falls back to location picker if multiple locations exist

**File**: `src/widget/hooks/useLocationDetection.ts`

---

### useSoundSettings

Manages notification sound preferences.

```tsx
import { useSoundSettings } from '@/widget/hooks/useSoundSettings';

const {
  soundEnabled, // boolean - Are sounds enabled
  playSound,    // () => void - Play notification sound
  toggleSound,  // () => void - Toggle sound on/off
} = useSoundSettings();
```

**File**: `src/widget/hooks/useSoundSettings.ts`

---

### useSystemTheme

Detects system color scheme preference.

```tsx
import { useSystemTheme } from '@/widget/hooks/useSystemTheme';

const theme = useSystemTheme(); // 'light' | 'dark'
```

**File**: `src/widget/hooks/useSystemTheme.ts`

---

### useParentMessages

Handles postMessage communication with parent window.

```tsx
import { useParentMessages } from '@/widget/hooks/useParentMessages';

useParentMessages({
  onOpen: () => setIsOpen(true),
  onClose: () => setIsOpen(false),
  onConfigUpdate: (config) => updateConfig(config),
});
```

**File**: `src/widget/hooks/useParentMessages.ts`

---

## Usage Patterns

### Combining Hooks

```tsx
const AgentDashboard = () => {
  const { agent, agentId, loading: agentLoading } = useAgent();
  const { conversations } = useConversations();
  const { sources } = useKnowledgeSources(agentId || undefined);
  const { hasPermission } = useRoleAuthorization();
  
  if (agentLoading) return <LoadingState />;
  
  return (
    <div>
      <h1>{agent?.name}</h1>
      <p>{conversations.length} conversations</p>
      <p>{sources.length} knowledge sources</p>
      {hasPermission('manage_agents') && (
        <Button>Edit Agent</Button>
      )}
    </div>
  );
};
```

### Error Handling

All hooks use `catch (error: unknown)` with the `getErrorMessage()` utility for type-safe error handling.

#### Standard Pattern

```tsx
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/utils/logger';
import { toast } from '@/lib/toast';

const myAsyncFunction = async () => {
  try {
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    return data;
  } catch (error: unknown) {
    logger.error('Operation failed:', error);
    toast.error('Failed to load data', {
      description: getErrorMessage(error),
    });
    return null;
  }
};
```

#### Error Type Utilities (`src/types/errors.ts`)

```tsx
import { getErrorMessage, hasErrorMessage, hasErrorCode } from '@/types/errors';

// Safe message extraction from unknown error
const message = getErrorMessage(error);

// Type guards for error inspection
if (hasErrorMessage(error)) {
  console.log(error.message); // TypeScript knows message exists
}

if (hasErrorCode(error)) {
  console.log(error.code); // TypeScript knows code exists (Supabase errors)
}
```

#### React Query Error Display

```tsx
const { leads, isLoading, error } = useLeads();

if (error) {
  return <ErrorState message={error.message} onRetry={refetch} />;
}

if (isLoading) {
  return <LoadingState />;
}

return <LeadsList leads={leads} />;
```

### Optimistic Updates

```tsx
const { updateLead } = useLeads();

const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
  // React Query handles optimistic updates internally
  await updateLead(leadId, { status: newStatus });
  toast.success('Status updated');
};
```

---

## Analytics Hooks

### useConversationFunnel

Fetches and computes conversation funnel data showing drop-off across the customer journey.

```tsx
import { useConversationFunnel } from '@/hooks/useConversationFunnel';

const {
  stages,    // FunnelStage[] - Array of funnel stages with counts/percentages
  loading,   // boolean - Loading state
  refetch,   // () => Promise<void> - Refetch all funnel data
} = useConversationFunnel(startDate, endDate, enabled);
```

**FunnelStage Interface**:
```typescript
interface FunnelStage {
  name: string;           // Stage name (Started, Engaged, Lead Captured, Booked, Resolved)
  count: number;          // Conversations at this stage
  percentage: number;     // Percentage of total (0-100)
  dropOffPercent: number; // Drop-off from previous stage (0-100)
  color: string;          // HSL color for visualization
}
```

**Key Features**:
- Parallel queries for conversations, leads, and bookings
- Computes engagement (2+ messages), lead capture, booking, and resolution rates
- 5-minute stale time for performance

**File**: `src/hooks/useConversationFunnel.ts`

---

### useTrafficAnalytics

Fetches and processes website traffic analytics from conversation metadata.

```tsx
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';

const {
  trafficSources,        // TrafficSourceData[] - Traffic by source (organic, direct, etc.)
  landingPages,          // LandingPageData[] - Landing page performance
  pageVisits,            // PageVisitData[] - Page visit aggregations
  locationData,          // LocationData[] - Visitor geography with coordinates
  engagement,            // EngagementMetrics - Bounce rate, pages/session, duration
  sourcesByDate,         // DailySourceData[] - Daily traffic source breakdown
  pageDepthDistribution, // PageDepthData[] - Session depth distribution
  leadsBySource,         // LeadSourceData[] - Leads captured by traffic source
  loading,               // boolean - Loading state
  refetch,               // () => void - Refetch traffic data
} = useTrafficAnalytics(startDate, endDate, enabled);
```

**Key Interfaces**:
```typescript
interface TrafficSourceData {
  name: string;   // Source name (e.g., "organic", "direct")
  value: number;  // Conversation count
  color: string;  // Chart color
}

interface LeadSourceData {
  source: string;   // Traffic source identifier
  leads: number;    // Leads captured
  sessions: number; // Sessions from this source
  cvr: number;      // Conversion rate percentage
}

interface EngagementMetrics {
  bounceRate: number;
  avgPagesPerSession: number;
  avgSessionDuration: number;
  totalSessions: number;
  totalLeads: number;
  overallCVR: number;
}
```

**Key Features**:
- Extracts traffic data from conversation metadata
- Real-time updates via Supabase subscription
- Computes engagement metrics, page depth, and lead source attribution

**File**: `src/hooks/useTrafficAnalytics.ts`

---

### useMockAnalyticsData

Provides toggleable mock data for analytics visualization during development.

```tsx
import { useMockAnalyticsData } from '@/hooks/useMockAnalyticsData';

const {
  enabled,     // boolean - Whether mock mode is active
  setEnabled,  // (enabled: boolean) => void - Toggle mock mode
  mockData,    // MockAnalyticsData | null - All mock data when enabled
  regenerate,  // () => void - Generate new random values
} = useMockAnalyticsData();
```

**Key Features**:
- Persisted in localStorage (`analytics_mock_mode` key)
- Generates comprehensive mock data for all analytics components
- Useful for development and testing without real data

**File**: `src/hooks/useMockAnalyticsData.ts`

---

### useReportExports

Manages report export history with file storage and database records.

```tsx
import { useReportExports } from '@/hooks/useReportExports';

const {
  exports,           // ReportExport[] - All export records
  isLoading,         // boolean - Loading state
  createExport,      // (params: CreateExportParams) => Promise<ReportExport>
  deleteExport,      // (id: string) => Promise<void>
  getDownloadUrl,    // (filePath: string) => Promise<string | null>
  isCreating,        // boolean - Creating export state
  isDeleting,        // boolean - Deleting export state
} = useReportExports();
```

**CreateExportParams**:
```typescript
interface CreateExportParams {
  blob: Blob;
  fileName: string;
  format: 'csv' | 'pdf';
  dateRangeStart: Date;
  dateRangeEnd: Date;
  reportConfig: Record<string, unknown>;
}
```

**Key Features**:
- React Query caching with automatic refetch
- Uploads files to Supabase Storage (`report-exports` bucket)
- Creates database records in `report_exports` table
- Generates signed download URLs (1 hour expiry)
- Cleans up both storage and database on delete

**Note**: The `ReportConfig` type should be imported from `@/types/report-config`:
```tsx
import type { ReportConfig } from '@/types/report-config';
```

**File**: `src/hooks/useReportExports.ts`

---

### useScheduledReports

Manages scheduled report configurations with CRUD operations.

```tsx
import { useScheduledReports } from '@/hooks/useScheduledReports';

const {
  reports,              // ScheduledReport[] - All scheduled reports
  loading,              // boolean - Loading state
  createReport,         // (report: ScheduledReportInsert) => Promise<void>
  updateReport,         // (id: string, updates: Partial<ScheduledReportInsert>) => Promise<void>
  deleteReport,         // (id: string) => Promise<void>
  toggleReportStatus,   // (id: string, active: boolean) => Promise<void>
  refetch,              // () => void - Trigger background refetch
} = useScheduledReports();
```

**ScheduledReport Interface**:
```typescript
interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  day_of_week: number | null;     // 0-6 for weekly reports
  day_of_month: number | null;    // 1-31 for monthly reports
  time_of_day: string;            // HH:MM format
  recipients: string[];           // Email addresses
  report_config: ReportConfig;
  active: boolean;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**Key Features**:
- React Query caching with real-time updates
- Supabase subscription for `scheduled_reports` table
- Automatic cache invalidation on mutations
- Toast notifications for success/error states

**Note**: The `ReportConfig` type should be imported from `@/types/report-config`:
```tsx
import type { ReportConfig } from '@/types/report-config';
```

**File**: `src/hooks/useScheduledReports.ts`

---

### useAnalyticsData

Consolidated data hook for the Analytics page. Combines all analytics data fetching, mock mode switching, KPI calculations, and trend values.

```tsx
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

const {
  // Raw Data
  conversationStats,        // ConversationStatItem[] - Daily conversation counts
  leadStats,                // Array - Daily lead counts by status
  bookingStats,             // BookingStats | null - Booking summary
  satisfactionStats,        // SatisfactionStats | null - CSAT summary
  aiPerformanceStats,       // AIPerformanceStats | null - AI performance
  trafficSources,           // MockTrafficSource[] - Traffic source breakdown
  funnelStages,             // MockFunnelStage[] - Conversation funnel
  
  // Calculated KPIs
  totalConversations,       // number
  totalLeads,               // number
  conversionRate,           // string (e.g., "12.5")
  totalBookings,            // number
  avgSatisfaction,          // number (1-5 scale)
  containmentRate,          // number (percentage)
  
  // Trend Values
  conversationTrendValue,   // number - Period-over-period change
  leadTrendValue,           // number
  bookingTrendValue,        // number
  
  // Chart Data
  conversationChartData,    // { value: number }[] - For sparklines
  leadChartData,            // { value: number }[]
  
  // Loading States
  loading,                  // boolean - Core analytics loading
  bookingLoading,           // boolean
  satisfactionLoading,      // boolean
  
  // Mock Mode
  mockMode,                 // boolean - Whether using mock data
  setMockMode,              // (enabled: boolean) => void
  regenerateMockData,       // () => void
  
  // Actions
  refetch,                  // () => void
} = useAnalyticsData({
  startDate: Date,
  endDate: Date,
  comparisonStartDate: Date,
  comparisonEndDate: Date,
  comparisonMode: boolean,
  filters: { leadStatus: string, conversationStatus: string },
});
```

**Key Features**:
- Combines 6 data hooks into single interface
- Automatic mock/real data switching
- Pre-calculated KPIs and trends
- Chart data transformations

**File**: `src/hooks/useAnalyticsData.ts`

---

### useOnboardingProgress

Tracks completion status of onboarding steps for an AI agent.

```tsx
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

const {
  steps,              // OnboardingStep[] - All onboarding steps with completion status
  completedCount,     // number - Steps completed
  totalCount,         // number - Total steps
  percentComplete,    // number - Completion percentage (0-100)
  allComplete,        // boolean - Whether all steps are done
  currentStep,        // OnboardingStep | null - First incomplete step
  loading,            // boolean
  agentId,            // string | null
} = useOnboardingProgress();
```

**OnboardingStep Interface**:
```typescript
interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType;
  isComplete: boolean;
  action: { label: string; href: string };
}
```

**Key Features**:
- Aggregates data from multiple hooks (agent, knowledge sources, conversations, etc.)
- Tracks 7 onboarding steps (customize appearance, knowledge, help center, etc.)
- Memoized calculations for performance

**File**: `src/hooks/useOnboardingProgress.ts`

---

### useSearchData

Fetches and aggregates data from various tables for unified search results.

```tsx
import { useSearchData } from '@/hooks/useSearchData';

const {
  searchResults,    // SearchResult[] - All searchable items
  loading,          // boolean
  refetch,          // () => void
} = useSearchData();
```

**SearchResult Interface**:
```typescript
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  iconName?: string;
  url?: string;
  action?: () => void;
  shortcut?: string;
}
```

**Categories**:
- Navigation links, Conversations, Leads, Help Articles
- News Items, Webhooks, Tools, Knowledge Sources
- Team Members, Settings sections

**File**: `src/hooks/useSearchData.ts`

---

### usePlanLimits

Checks subscription plan limits and current usage.

```tsx
import { usePlanLimits } from '@/hooks/usePlanLimits';

const {
  limits,               // PlanLimits | null - Maximum resource counts
  usage,                // CurrentUsage | null - Current consumption
  loading,              // boolean
  planName,             // string - Current plan name
  checkLimit,           // (resourceType, additionalCount?) => LimitCheck
  canAddKnowledgeSource, // () => LimitCheck
  canAddTeamMember,     // () => LimitCheck
  showLimitWarning,     // (resourceType, check, action?) => boolean
  refetch,              // () => void
} = usePlanLimits();
```

**LimitCheck Interface**:
```typescript
interface LimitCheck {
  allowed: boolean;
  current: number;
  limit: number;
  nearLimit: boolean;   // Within 80% of limit
}
```

**Key Features**:
- Fetches plan limits from subscriptions table
- Calculates current usage from various tables
- Shows toast warnings when approaching/at limits

**File**: `src/hooks/usePlanLimits.ts`

---

### useGlobalSearch

Manages global search dialog state with keyboard shortcut support.

```tsx
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

const {
  open,       // boolean - Whether search dialog is open
  setOpen,    // (open: boolean) => void - Toggle search dialog
} = useGlobalSearch();
```

**Keyboard Shortcuts**:
- `Cmd/Ctrl+K` - Toggle search dialog
- `Escape` - Close search dialog

**Note**: This hook re-exports from `GlobalSearchContext`. Must be used within `GlobalSearchProvider`.

**File**: `src/hooks/useGlobalSearch.ts`, `src/contexts/GlobalSearchContext.tsx`

---

### useEmbeddedChatConfig

Manages embedded chat widget configuration.

```tsx
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';

const {
  config,           // EmbeddedChatConfig - Current configuration
  loading,          // boolean
  saveConfig,       // (newConfig: Partial<EmbeddedChatConfig>) => Promise<void>
  generateEmbedCode, // () => string - Generate HTML embed snippet
} = useEmbeddedChatConfig(agentId: string);
```

**EmbeddedChatConfig Interface** (partial):
```typescript
interface EmbeddedChatConfig {
  // Appearance
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  gradientStartColor: string;
  gradientEndColor: string;
  
  // Content
  welcomeMessage: string;
  placeholderText: string;
  
  // Features
  enableVoice: boolean;
  enableAttachments: boolean;
  showHelpCenter: boolean;
  
  // Lead capture
  customFields: CustomField[];
  quickActions: QuickAction[];
}
```

**Key Features**:
- Fetches config from agent deployment settings
- Generates complete HTML embed code snippet
- Saves config changes to Supabase

**File**: `src/hooks/useEmbeddedChatConfig.ts`

---

### useCalendarKeyboardShortcuts

Calendar-specific keyboard shortcuts for navigation and view switching.

```tsx
import { useCalendarKeyboardShortcuts } from '@/hooks/useCalendarKeyboardShortcuts';

useCalendarKeyboardShortcuts({
  onPrevious: () => void,    // Called on ArrowLeft
  onNext: () => void,        // Called on ArrowRight
  onToday: () => void,       // Called on T key
  onViewChange: (view: CalendarView) => void, // M/W/D keys
});
```

**Shortcuts**:
| Key | Action |
|-----|--------|
| `←` | Go to previous period |
| `→` | Go to next period |
| `T` | Go to today |
| `M` | Switch to month view |
| `W` | Switch to week view |
| `D` | Switch to day view |

**Note**: Shortcuts are disabled when focus is in an input/textarea.

**File**: `src/hooks/useCalendarKeyboardShortcuts.ts`

---

### useAutoResizeTextarea

Automatically resizes a textarea based on content.

```tsx
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';

const textareaRef = useRef<HTMLTextAreaElement>(null);

useAutoResizeTextarea(textareaRef, value, {
  minRows: 1,       // Minimum number of rows (default: 1)
  maxRows: 5,       // Maximum number of rows (default: 5)
  lineHeight: 20,   // Line height in pixels (default: 20)
});

return <textarea ref={textareaRef} value={value} onChange={...} />;
```

**Key Features**:
- Adjusts height between min and max rows
- Adds scrollbar when exceeding max height
- Triggers on value change

**File**: `src/hooks/useAutoResizeTextarea.ts`

---

### useWordPressHomes

Manages WordPress home/property data synchronization.

```tsx
import { useWordPressHomes } from '@/hooks/useWordPressHomes';

const {
  siteUrl,              // string | null - WordPress site URL
  homeEndpoint,         // string | null - Homes API endpoint
  isConnected,          // boolean - Whether WordPress is configured
  isTesting,            // boolean - Testing connection
  isSyncing,            // boolean - Syncing homes
  testResult,           // TestResult | null - Last test result
  testHomesEndpoint,    // (url, endpoint?) => Promise<TestResult>
  syncHomes,            // (url?, useAiExtraction?, endpoint?) => Promise<SyncResult>
  clearTestResult,      // () => void
} = useWordPressHomes({
  agent: Agent,
  onSyncComplete?: () => void,
});
```

**Key Features**:
- Tests WordPress homes endpoint connectivity
- Syncs property data via Supabase edge function
- Supports AI-powered data extraction

**File**: `src/hooks/useWordPressHomes.ts`

---

## Related Documentation

- [Supabase Integration Guide](./SUPABASE_INTEGRATION_GUIDE.md) - Data fetching patterns
- [Application Overview](./APPLICATION_OVERVIEW.md) - Project structure
- [Design System](./DESIGN_SYSTEM.md) - UI guidelines
- [PDF Generator](./PDF_GENERATOR.md) - PDF report generation
