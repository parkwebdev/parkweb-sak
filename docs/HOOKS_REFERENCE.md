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

### useTrafficAnalytics

Fetches visitor traffic and page analytics.

```tsx
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';

const {
  trafficSources,   // TrafficSourceData[] - Referrer breakdown
  landingPages,     // LandingPageData[] - Top landing pages
  pageVisits,       // PageVisitData[] - Page visit data
  loading,          // boolean
  agentId,          // string | null
  refetch,          // () => void
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

---

### useScheduledReports

**Powered by React Query** - Report data is cached and real-time updates via Supabase subscription automatically invalidate the cache.

```tsx
import { useScheduledReports } from '@/hooks/useScheduledReports';

const {
  reports,            // ScheduledReport[] - All reports
  loading,            // boolean
  createReport,       // (data) => Promise
  updateReport,       // (id, data) => Promise
  deleteReport,       // (id) => Promise
  toggleReportStatus, // (id, active) => Promise
  refetch,            // () => void
} = useScheduledReports();
```

**File**: `src/hooks/useScheduledReports.ts`

---

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

### useBreakpoint

Detects if viewport is at or above a given breakpoint.

```tsx
import { useBreakpoint } from '@/hooks/use-breakpoint';

const isDesktop = useBreakpoint('lg'); // boolean - true if viewport >= 1024px
const isTablet = useBreakpoint('md');  // boolean - true if viewport >= 768px
```

**Breakpoints**: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)

**File**: `src/hooks/use-breakpoint.ts`

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

### useLocations

Manages location CRUD operations.

```tsx
import { useLocations } from '@/hooks/useLocations';

const {
  locations,        // Location[] - All locations
  isLoading,       // boolean
  createLocation,  // (data) => Promise
  updateLocation,  // (id, data) => Promise
  deleteLocation,  // (id) => Promise
} = useLocations(agentId: string);
```

**File**: `src/hooks/useLocations.ts`

---

### useCalendarEvents

Manages calendar event operations.

```tsx
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

const {
  events,           // CalendarEvent[] - All events
  isLoading,       // boolean
  createEvent,     // (data) => Promise
  updateEvent,     // (id, data) => Promise
  deleteEvent,     // (id) => Promise
  refetch,         // () => void
} = useCalendarEvents(agentId?: string);
```

**File**: `src/hooks/useCalendarEvents.ts`

---

### useConnectedAccounts

Manages OAuth connected accounts (calendars).

```tsx
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';

const {
  accounts,         // ConnectedAccount[] - All connected accounts
  isLoading,       // boolean
  disconnectAccount, // (id) => Promise
  refetch,         // () => void
} = useConnectedAccounts(agentId: string);
```

**File**: `src/hooks/useConnectedAccounts.ts`

---

### useWordPressConnection

Manages WordPress API connection.

```tsx
import { useWordPressConnection } from '@/hooks/useWordPressConnection';

const {
  connection,       // WordPressConnection | null
  isLoading,       // boolean
  connect,         // (apiUrl, apiKey) => Promise
  disconnect,      // () => Promise
  testConnection,  // () => Promise<boolean>
} = useWordPressConnection(agentId: string);
```

**File**: `src/hooks/useWordPressConnection.ts`

---

### useWordPressHomes

Fetches WordPress home listings.

```tsx
import { useWordPressHomes } from '@/hooks/useWordPressHomes';

const {
  homes,           // WordPressHome[] - All homes
  isLoading,      // boolean
  syncHomes,      // () => Promise - Trigger sync
  refetch,        // () => void
} = useWordPressHomes(agentId: string, locationId?: string);
```

**File**: `src/hooks/useWordPressHomes.ts`

---

### useProperties

Manages property listings from knowledge sources.

```tsx
import { useProperties } from '@/hooks/useProperties';

const {
  properties,      // Property[] - All properties
  isLoading,      // boolean
  refetch,        // () => void
} = useProperties(agentId: string, filters?: PropertyFilters);
```

**File**: `src/hooks/useProperties.ts`

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

## Related Documentation

- [Supabase Integration Guide](./SUPABASE_INTEGRATION_GUIDE.md) - Data fetching patterns
- [Application Overview](./APPLICATION_OVERVIEW.md) - Project structure
- [Design System](./DESIGN_SYSTEM.md) - UI guidelines
