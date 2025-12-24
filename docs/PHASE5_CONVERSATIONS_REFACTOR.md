# Phase 5: Conversations.tsx Refactor

> **Priority**: D (Architectural)  
> **Status**: Planning  
> **Target**: Reduce from 1,528 lines to ~300 lines  
> **Visual Changes**: NONE - Pure structural refactor

---

## Overview

The current `Conversations.tsx` is a 1,528-line monolithic component that violates single-responsibility principle. This refactor extracts logic into focused hooks and components while maintaining **100% identical visual output**.

---

## Alignment with Optimization Phases

This refactor incorporates patterns established in Phases 1-4:

### From Phase 1: High-Impact Hook Migrations
- Extract conversation-specific hooks following the pattern of existing hooks
- Use `useSupabaseQuery` patterns where applicable
- Implement proper React Query integration for data fetching

### From Phase 2: Code Splitting
- New components will use dynamic imports where beneficial
- Heavy sub-components (emoji picker, file previews) already lazy-loaded
- Message components wrapped in Suspense boundaries

### From Phase 3: Production Logging Cleanup
- All new hooks/components use `logger` utility (not `console.log`)
- Conditional logging via `import.meta.env.DEV`

### From Phase 4: Memoization Pass
- All extracted components wrapped with `React.memo`
- Callbacks wrapped with `useCallback`
- Computed values wrapped with `useMemo`
- Props use stable references

---

## Implementation Sections

### Section 1: Extract Custom Hooks (No Visual Impact)

#### 1.1 `src/hooks/useConversationMessages.ts`

**Purpose**: Manage message state, loading, and real-time subscriptions

**Extracts from Conversations.tsx**:
- Lines 117-118: `messages`, `loadingMessages` state
- Lines 287-386: `loadMessages()` function
- Lines 296-386: Real-time subscription setup
- Lines 287-295: `newMessageIdsRef` for animation tracking

**Interface**:
```typescript
interface UseConversationMessagesOptions {
  conversationId: string | null;
  onNewMessage?: (message: Message) => void;
}

interface UseConversationMessagesReturn {
  messages: Message[];
  loadingMessages: boolean;
  loadMessages: () => Promise<void>;
  isNewMessage: (messageId: string) => boolean;
  markMessagesRead: () => Promise<void>;
}
```

**Phase 4 Alignment**:
- `loadMessages` wrapped in `useCallback`
- Message list updates use functional setState

---

#### 1.2 `src/hooks/useTypingPresence.ts`

**Purpose**: Handle admin typing indicator broadcasting

**Extracts from Conversations.tsx**:
- Lines 154-156: `isTypingBroadcast`, refs
- Lines 692-748: Channel setup and typing functions

**Interface**:
```typescript
interface UseTypingPresenceOptions {
  conversation: Conversation | null;
  userId: string | null;
}

interface UseTypingPresenceReturn {
  handleTyping: () => void;
  stopTypingIndicator: () => void;
}
```

**Phase 4 Alignment**:
- Both functions wrapped in `useCallback`
- Cleanup in `useEffect` return

---

#### 1.3 `src/hooks/useVisitorPresence.ts`

**Purpose**: Track visitor online/offline status

**Extracts from Conversations.tsx**:
- Lines 159: `activeVisitors` state
- Lines 173-208: Presence subscription

**Interface**:
```typescript
interface UseVisitorPresenceOptions {
  agentId: string | null;
}

interface UseVisitorPresenceReturn {
  activeVisitors: Map<string, boolean>;
  getVisitorPresence: (visitorId: string) => boolean;
}
```

**Phase 4 Alignment**:
- `getVisitorPresence` wrapped in `useCallback`
- Map updates use functional setState

---

### Section 2: Extract Utility Functions (No Visual Impact)

#### 2.1 `src/lib/conversation-utils.ts`

**Purpose**: Consolidate conversation-related utility functions

**Extracts from Conversations.tsx**:
- Lines 64-78: `getStatusColor()`
- Lines 161-171: `getPriorityIndicator()`
- Lines 512-556: `updateMessageReaction()`
- Lines 524-533: `getUnreadCount()`
- Lines 536-556: `formatUrl()`

**Interface**:
```typescript
export function getStatusColor(status: string): string;
export function getPriorityIndicator(priority?: string): React.ReactNode;
export function getUnreadCount(conversation: Conversation): number;
export function formatUrl(url: string): string;
export async function updateMessageReaction(
  messageId: string,
  emoji: string,
  action: 'add' | 'remove',
  reactorType: 'user' | 'admin'
): Promise<{ success: boolean }>;
```

---

### Section 3: Extract UI Components

All components will:
- Be wrapped with `React.memo` (Phase 4)
- Use `useCallback` for event handlers (Phase 4)
- Use `logger` instead of `console.log` (Phase 3)
- Preserve **exact** className strings and styles

---

#### 3.1 `src/components/conversations/ConversationsList.tsx`

**Purpose**: Left sidebar showing conversation list

**Extracts from Conversations.tsx**: Lines 761-918

**Visual Elements Preserved**:
```
Container: hidden lg:flex border-r flex-col bg-background transition-all duration-300
Header: h-14 px-4 border-b flex items-center justify-between shrink-0
Sort dropdown with exact styling
Conversation items with avatars, badges, indicators
Empty/loading states
```

**Props**:
```typescript
interface ConversationsListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  sortBy: 'recent' | 'unread' | 'priority';
  onSortChange: (sort: 'recent' | 'unread' | 'priority') => void;
  activeFilter: string | null;
  getVisitorPresence: (visitorId: string) => boolean;
  getUnreadCount: (conversation: Conversation) => number;
}
```

---

#### 3.2 `src/components/conversations/ConversationItem.tsx`

**Purpose**: Single conversation row in the list

**Extracts from Conversations.tsx**: Lines 858-912

**Visual Elements Preserved**:
```
Button: w-full text-left p-4 hover:bg-accent/30 transition-colors relative
Avatar with status indicators
Lead name, preview text truncation
Status badge, priority indicator, timestamp
Unread count badge positioning
```

**Props**:
```typescript
interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  isVisitorActive: boolean;
  unreadCount: number;
}
```

**Phase 4 Alignment**: Wrapped with `React.memo` with custom comparison

---

#### 3.3 `src/components/conversations/ChatHeader.tsx`

**Purpose**: Header bar of the chat area

**Extracts from Conversations.tsx**: Lines 924-970

**Visual Elements Preserved**:
```
Container: h-14 px-6 border-b flex items-center justify-between bg-background shrink-0
Active indicator with ping animation
Action buttons with exact variants and sizes
```

**Props**:
```typescript
interface ChatHeaderProps {
  conversation: Conversation;
  isVisitorActive: boolean;
  onTakeover: () => void;
  onReturnToAI: () => void;
  onClose: () => void;
  onReopen: () => void;
  onToggleTranslation: () => void;
  showTranslation: boolean;
  isTranslating: boolean;
}
```

---

#### 3.4 `src/components/conversations/TranslationBanner.tsx`

**Purpose**: Translation status banner below header

**Extracts from Conversations.tsx**: Lines 971-999

**Visual Elements Preserved**:
```
Container: px-6 py-2.5 border-b bg-accent/30 flex items-center justify-between
Flag emoji, language text
Translate button with loading state
```

**Props**:
```typescript
interface TranslationBannerProps {
  detectedLanguage: string;
  onTranslate: () => void;
  isTranslating: boolean;
}
```

---

#### 3.5 `src/components/conversations/MessageThread.tsx`

**Purpose**: Scrollable message list container

**Extracts from Conversations.tsx**: Lines 1000-1346

**Visual Elements Preserved**:
```
Container: flex-1 overflow-y-auto px-6 py-4 min-h-0
Message filtering (hide tool messages)
Grouping logic for continuation detection
Loading/empty states
```

**Props**:
```typescript
interface MessageThreadProps {
  messages: Message[];
  conversationMetadata: ConversationMetadata;
  showTranslation: boolean;
  translatedMessages: Map<string, string>;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  isNewMessage: (messageId: string) => boolean;
}
```

**Phase 4 Alignment**: Wrapped with `React.memo`

---

#### 3.6 `src/components/conversations/AdminMessageBubble.tsx`

**Purpose**: Individual message bubble for admin inbox

**Extracts from Conversations.tsx**: Lines 1106-1343 (the large map callback)

**Visual Elements Preserved**:
```
Avatar rendering (AI icon, human avatar, user initials)
Name + timestamp header layout
Bubble styling (user: bg-primary, other: bg-muted)
File attachment thumbnails with exact sizing
Link preview cards
Reaction display and quick-add buttons
Translation toggle
New message animation (motion.div)
```

**Props**:
```typescript
interface AdminMessageBubbleProps {
  message: Message;
  isUser: boolean;
  isHumanSent: boolean;
  isContinuation: boolean;
  isLastInGroup: boolean;
  conversationMetadata: ConversationMetadata;
  showTranslation: boolean;
  translatedContent?: string;
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  isNew: boolean;
}
```

**Phase 4 Alignment**: Wrapped with `React.memo` with custom comparison

---

#### 3.7 `src/components/conversations/MessageInputArea.tsx`

**Purpose**: Message input form at bottom

**Extracts from Conversations.tsx**: Lines 1349-1490

**Visual Elements Preserved**:
```
Container: px-6 py-4 border-t bg-background shrink-0
Pending files preview with remove buttons
Form layout with flex positioning
Emoji picker, attachment button, translate button
Textarea with auto-resize
Send button overlay positioning
```

**Props**:
```typescript
interface MessageInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileSelect: (files: FileList) => void;
  pendingFiles: File[];
  onRemoveFile: (index: number) => void;
  isSending: boolean;
  onTyping: () => void;
  conversationMetadata: ConversationMetadata;
  onTranslateOutbound: () => void;
  isTranslatingOutbound: boolean;
}
```

---

### Section 4: Refactor Main Component

After all extractions, `Conversations.tsx` becomes a ~300 line composition layer:

```tsx
const Conversations: React.FC = () => {
  // Existing hooks
  const { agent } = useAgent();
  const { user } = useAuth();
  const { conversations, ... } = useConversations(agent?.id);
  
  // NEW extracted hooks
  const { messages, loadingMessages, loadMessages, isNewMessage } = 
    useConversationMessages({ conversationId: selectedConversation?.id });
  const { handleTyping, stopTypingIndicator } = 
    useTypingPresence({ conversation: selectedConversation, userId: user?.id });
  const { activeVisitors, getVisitorPresence } = 
    useVisitorPresence({ agentId: agent?.id });
  
  // Minimal remaining state
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationsCollapsed, setConversationsCollapsed] = useState(...);
  const [metadataPanelCollapsed, setMetadataPanelCollapsed] = useState(...);
  
  // Memoized handlers (Phase 4)
  const handleSendMessage = useCallback(..., [deps]);
  const handleTakeover = useCallback(..., [deps]);
  
  return (
    <div className="h-full flex min-h-0 overflow-x-hidden">
      <InboxNavSidebar ... />
      <ConversationsList ... />
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            <ChatHeader ... />
            {showTranslation && <TranslationBanner ... />}
            <MessageThread ... />
            {selectedConversation.status === 'human_takeover' && (
              <MessageInputArea ... />
            )}
          </>
        ) : (
          <EmptyConversationView />
        )}
      </div>
      <ConversationMetadataPanel ... />
      <TakeoverDialog ... />
    </div>
  );
};

export default Conversations;
```

---

## New File Structure

```
src/
├── hooks/
│   ├── useConversationMessages.ts    (NEW ~120 lines)
│   ├── useTypingPresence.ts          (NEW ~60 lines)
│   └── useVisitorPresence.ts         (NEW ~50 lines)
├── components/conversations/
│   ├── ConversationMetadataPanel.tsx (EXISTS)
│   ├── InboxNavSidebar.tsx           (EXISTS)
│   ├── TakeoverDialog.tsx            (EXISTS)
│   ├── ConversationsList.tsx         (NEW ~180 lines)
│   ├── ConversationItem.tsx          (NEW ~100 lines)
│   ├── ChatHeader.tsx                (NEW ~80 lines)
│   ├── TranslationBanner.tsx         (NEW ~40 lines)
│   ├── MessageThread.tsx             (NEW ~150 lines)
│   ├── AdminMessageBubble.tsx        (NEW ~250 lines)
│   ├── MessageInputArea.tsx          (NEW ~160 lines)
│   └── index.ts                      (UPDATE - barrel export)
├── lib/
│   └── conversation-utils.ts         (NEW ~80 lines)
└── pages/
    └── Conversations.tsx             (REFACTORED ~300 lines)
```

**Total new code**: ~1,250 lines across 11 files  
**Original code**: 1,528 lines in 1 file  
**Net change**: Better organization, no duplication

---

## Implementation Order

1. **Section 2**: `conversation-utils.ts` (no dependencies)
2. **Section 1.3**: `useVisitorPresence.ts` (no dependencies)
3. **Section 1.2**: `useTypingPresence.ts` (no dependencies)
4. **Section 1.1**: `useConversationMessages.ts` (no dependencies)
5. **Section 3.2**: `ConversationItem.tsx` (smallest component)
6. **Section 3.1**: `ConversationsList.tsx` (uses ConversationItem)
7. **Section 3.4**: `TranslationBanner.tsx` (small, standalone)
8. **Section 3.3**: `ChatHeader.tsx` (standalone)
9. **Section 3.6**: `AdminMessageBubble.tsx` (complex, standalone)
10. **Section 3.5**: `MessageThread.tsx` (uses AdminMessageBubble)
11. **Section 3.7**: `MessageInputArea.tsx` (standalone)
12. **Section 4**: Refactor `Conversations.tsx` (uses all above)

---

## Visual Verification Checklist

Before completing each component:

- [ ] All classNames copied character-for-character
- [ ] All inline styles preserved exactly
- [ ] All conditional rendering logic intact
- [ ] All motion variants preserved (check `useReducedMotion`)
- [ ] All icon imports correct (size, color)
- [ ] All tooltips and popovers functioning
- [ ] Collapsed/expanded states work identically
- [ ] Real-time updates animate correctly
- [ ] Dark/light mode styles work

---

## Success Criteria

- [ ] `Conversations.tsx` reduced to <400 lines
- [ ] All 11 new files created and integrated
- [ ] **Zero visual regression** - Pixel-perfect match
- [ ] All functionality preserved:
  - [ ] Real-time message updates
  - [ ] Typing indicators (send and receive)
  - [ ] Message reactions (add/remove)
  - [ ] File attachments (upload, preview, download)
  - [ ] Translation (detect, translate, toggle)
  - [ ] Takeover/Return to AI flow
  - [ ] Close/Reopen conversation
  - [ ] URL param navigation (`?conversation=id`)
  - [ ] Keyboard shortcuts
  - [ ] Sound notifications
- [ ] Components properly memoized (no unnecessary re-renders)
- [ ] No TypeScript errors
- [ ] No console errors in development
- [ ] Documentation updated (HOOKS_REFERENCE.md, ARCHITECTURE.md)

---

## Documentation Updates Required

After implementation:

1. **`docs/HOOKS_REFERENCE.md`**
   - Add `useConversationMessages`
   - Add `useTypingPresence`
   - Add `useVisitorPresence`

2. **`docs/ARCHITECTURE.md`**
   - Update Inbox/Conversations section
   - Document new component structure

3. **`docs/COMPONENT_PATTERNS.md`**
   - Add conversation component patterns
   - Document memoization approach

---

## Rollback Plan

If issues arise during implementation:

1. Each section is independently testable
2. Can revert individual file extractions
3. Original `Conversations.tsx` preserved in git history
4. Feature flags not needed (pure refactor)

---

## Notes

- This is a **pure structural refactor** - no new features
- All business logic remains unchanged
- All API calls remain unchanged
- All real-time subscriptions remain unchanged
- Only file organization and code structure changes
