# ChatPad Hooks Reference

> **Last Updated**: December 2024  
> **Status**: Active  
> **Related**: [Application Overview](./APPLICATION_OVERVIEW.md), [Supabase Integration Guide](./SUPABASE_INTEGRATION_GUIDE.md)

Complete reference for all custom React hooks in the ChatPad application.

---

## Table of Contents

1. [Data Hooks](#data-hooks)
2. [UI & State Hooks](#ui--state-hooks)
3. [Authentication & Security Hooks](#authentication--security-hooks)
4. [Widget Hooks](#widget-hooks)
5. [Usage Patterns](#usage-patterns)

---

## Data Hooks

Hooks for fetching and mutating data with React Query and Supabase.

### useAgents

Manages AI agent CRUD operations.

```tsx
import { useAgents } from '@/hooks/useAgents';

const { 
  agents,           // Agent[] - List of agents
  isLoading,        // boolean - Loading state
  createAgent,      // (data) => Promise - Create new agent
  updateAgent,      // (id, data) => Promise - Update agent
  deleteAgent,      // (id) => Promise - Delete agent
  refetch           // () => void - Refresh data
} = useAgents();
```

**File**: `src/hooks/useAgents.ts`

---

### useConversations

Manages conversation data with real-time subscriptions.

```tsx
import { useConversations } from '@/hooks/useConversations';

const {
  conversations,          // Conversation[] - All conversations
  isLoading,             // boolean
  selectedConversation,  // Conversation | null
  messages,              // Message[] - Messages for selected
  takeover,              // (id) => Promise - Start takeover
  returnToAI,            // (id) => Promise - End takeover
  closeConversation,     // (id) => Promise - Close conversation
  sendMessage,           // (content) => Promise - Send human message
} = useConversations(agentId?: string);
```

**File**: `src/hooks/useConversations.ts`

---

### useLeads

Manages lead data and status updates.

```tsx
import { useLeads } from '@/hooks/useLeads';

const {
  leads,           // Lead[] - All leads
  isLoading,       // boolean
  createLead,      // (data) => Promise - Create lead
  updateLead,      // (id, data) => Promise - Update lead
  deleteLead,      // (id) => Promise - Delete lead
  updateStatus,    // (id, status) => Promise - Update status
} = useLeads();
```

**File**: `src/hooks/useLeads.ts`

---

### useKnowledgeSources

Manages knowledge sources for RAG.

```tsx
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';

const {
  sources,              // KnowledgeSource[] - All sources
  isLoading,           // boolean
  addSource,           // (type, source, file?) => Promise
  deleteSource,        // (id) => Promise
  retrainAll,          // () => Promise - Retrain embeddings
  getProcessingStatus, // (id) => ProcessingStatus
} = useKnowledgeSources(agentId: string);
```

**File**: `src/hooks/useKnowledgeSources.ts`

---

### useHelpArticles

Manages help center articles and categories.

```tsx
import { useHelpArticles } from '@/hooks/useHelpArticles';

const {
  categories,       // Category[] - All categories with articles
  isLoading,       // boolean
  createCategory,  // (data) => Promise
  updateCategory,  // (id, data) => Promise
  deleteCategory,  // (id, targetCategoryId?) => Promise
  createArticle,   // (data) => Promise
  updateArticle,   // (id, data) => Promise
  deleteArticle,   // (id) => Promise
  reorderArticles, // (categoryId, articleIds) => Promise
} = useHelpArticles(agentId: string);
```

**File**: `src/hooks/useHelpArticles.ts`

---

### useWebhooks

Manages webhook configurations.

```tsx
import { useWebhooks } from '@/hooks/useWebhooks';

const {
  webhooks,        // Webhook[] - All webhooks
  isLoading,      // boolean
  createWebhook,  // (data) => Promise
  updateWebhook,  // (id, data) => Promise
  deleteWebhook,  // (id) => Promise
  testWebhook,    // (id) => Promise<TestResult>
  getLogs,        // (id) => Promise<WebhookLog[]>
} = useWebhooks(agentId?: string);
```

**File**: `src/hooks/useWebhooks.ts`

---

### useTeam

Manages team members and invitations.

```tsx
import { useTeam } from '@/hooks/useTeam';

const {
  members,            // TeamMember[] - All team members
  pendingInvites,    // Invitation[] - Pending invitations
  isLoading,         // boolean
  inviteMember,      // (email, role) => Promise
  updateMemberRole,  // (memberId, role) => Promise
  removeMember,      // (memberId) => Promise
  resendInvite,      // (inviteId) => Promise
  cancelInvite,      // (inviteId) => Promise
} = useTeam();
```

**File**: `src/hooks/useTeam.ts`

---

### useAnalytics

Fetches analytics data and metrics.

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

const {
  metrics,           // AnalyticsMetrics - KPI data
  conversationStats, // ConversationStats - Conversation analytics
  agentPerformance,  // AgentPerformance[] - Per-agent stats
  isLoading,        // boolean
  dateRange,        // { from, to } - Selected range
  setDateRange,     // (range) => void
} = useAnalytics();
```

**File**: `src/hooks/useAnalytics.ts`

---

### useTrafficAnalytics

Fetches visitor traffic and page analytics.

```tsx
import { useTrafficAnalytics } from '@/hooks/useTrafficAnalytics';

const {
  pageVisits,       // PageVisit[] - Page visit data
  landingPages,     // LandingPage[] - Top landing pages
  trafficSources,   // TrafficSource[] - Referrer breakdown
  isLoading,       // boolean
} = useTrafficAnalytics(agentId: string, dateRange: DateRange);
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

Manages scheduled analytics reports.

```tsx
import { useScheduledReports } from '@/hooks/useScheduledReports';

const {
  reports,          // ScheduledReport[] - All reports
  isLoading,       // boolean
  createReport,    // (data) => Promise
  updateReport,    // (id, data) => Promise
  deleteReport,    // (id) => Promise
  toggleActive,    // (id, active) => Promise
} = useScheduledReports();
```

**File**: `src/hooks/useScheduledReports.ts`

---

### useNewsItems

Manages news/announcement items for widget.

```tsx
import { useNewsItems } from '@/hooks/useNewsItems';

const {
  newsItems,        // NewsItem[] - All news items
  isLoading,       // boolean
  createNewsItem,  // (data) => Promise
  updateNewsItem,  // (id, data) => Promise
  deleteNewsItem,  // (id) => Promise
  togglePublished, // (id, published) => Promise
} = useNewsItems(agentId: string);
```

**File**: `src/hooks/useNewsItems.ts`

---

### useAnnouncements

Manages carousel announcements for widget home.

```tsx
import { useAnnouncements } from '@/hooks/useAnnouncements';

const {
  announcements,      // Announcement[] - All announcements
  isLoading,         // boolean
  createAnnouncement, // (data) => Promise
  updateAnnouncement, // (id, data) => Promise
  deleteAnnouncement, // (id) => Promise
  reorder,           // (ids) => Promise
} = useAnnouncements(agentId: string);
```

**File**: `src/hooks/useAnnouncements.ts`

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

### useConversations (Widget)

Manages widget conversations.

```tsx
import { useConversations } from '@/widget/hooks/useConversations';

const {
  conversations,         // Conversation[]
  currentConversation,   // Conversation | null
  createConversation,    // () => Promise<Conversation>
  selectConversation,    // (id) => void
} = useConversations(agentId: string);
```

**File**: `src/widget/hooks/useConversations.ts`

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
const AgentDashboard = ({ agentId }: { agentId: string }) => {
  const { agents, isLoading: agentsLoading } = useAgents();
  const { conversations } = useConversations(agentId);
  const { sources } = useKnowledgeSources(agentId);
  const { hasPermission } = useRoleAuthorization();
  
  const agent = agents.find(a => a.id === agentId);
  
  if (agentsLoading) return <LoadingState />;
  
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
