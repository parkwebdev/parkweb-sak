# ChatWidget Refactoring Plan

## Executive Summary

The `src/widget/ChatWidget.tsx` file has grown to **2,489 lines**, making it difficult to maintain, test, and debug. This document outlines a comprehensive plan to refactor it into smaller, focused components without changing any functionality.

---

## Current State Analysis

### File Statistics
- **Total Lines**: 2,489
- **State Variables**: 40+
- **useEffect Hooks**: 20+
- **Helper Functions**: 15+
- **UI Sections**: 5 major views

### Current Structure Breakdown

| Section | Lines (Approx) | Description |
|---------|----------------|-------------|
| Imports & Types | 1-110 | Dependencies, interfaces, types |
| Helper Functions | 111-170 | `detectEntryType`, `parseUtmParams`, `getIsMobileFullScreen` |
| State Declarations | 170-260 | 40+ useState hooks |
| Effects & Subscriptions | 260-1060 | Real-time subscriptions, lifecycle management |
| Event Handlers | 1060-1400 | Message sending, recording, form submission |
| Render Logic | 1400-2489 | JSX for all views |

### Pain Points

1. **Cognitive Load**: Developers must understand 2,500 lines to make any change
2. **Testing Difficulty**: Cannot unit test individual UI sections
3. **Merge Conflicts**: High likelihood of conflicts with multiple developers
4. **Code Reuse**: Duplicated patterns that could be shared
5. **Performance**: React re-renders entire component on any state change

---

## Proposed Architecture

### Directory Structure

```
src/widget/
├── ChatWidget.tsx              # Main orchestrator (~200 lines)
├── types.ts                    # Shared TypeScript interfaces
├── constants.ts                # CSS variables, config defaults
├── utils/
│   ├── index.ts
│   ├── traffic-detection.ts    # detectEntryType, parseUtmParams
│   ├── formatting.ts           # formatTimestamp, sanitization
│   └── validation.ts           # Form validation functions
├── hooks/
│   ├── index.ts
│   ├── useWidgetConfig.ts      # Config fetching & state
│   ├── useConversations.ts     # Conversation CRUD & localStorage
│   ├── useMessages.ts          # Message state & real-time sync
│   ├── useRealtime.ts          # Supabase subscriptions
│   ├── usePageTracking.ts      # Page visits & referrer journey
│   ├── useVisitorPresence.ts   # Visitor presence broadcasting
│   ├── useAudioRecording.ts    # Voice recording logic
│   └── useContactForm.ts       # Form state & submission
├── views/
│   ├── index.ts
│   ├── HomeView.tsx            # Home screen with announcements
│   ├── MessagesView.tsx        # Chat interface container
│   ├── HelpView.tsx            # Help center container
│   └── ConversationList.tsx    # Previous conversations list
├── components/
│   ├── index.ts
│   ├── WidgetHeader.tsx        # Header for non-home views
│   ├── HomeHeader.tsx          # Gradient header with logo
│   ├── BottomNav.tsx           # Navigation tabs
│   ├── MessageBubble.tsx       # Individual message component
│   ├── MessageList.tsx         # Messages container with scroll
│   ├── MessageInput.tsx        # Input area with attachments
│   ├── ContactForm.tsx         # New user contact form
│   ├── TypingIndicator.tsx     # Typing dots animation
│   ├── TakeoverBanner.tsx      # Human takeover notice
│   ├── QuickActions.tsx        # Quick action cards
│   ├── Announcements.tsx       # Announcement cards
│   ├── CategoryList.tsx        # Help categories
│   ├── ArticleList.tsx         # Articles in category
│   ├── ArticleContent.tsx      # Article with feedback
│   └── BrandingFooter.tsx      # "Powered by ChatPad"
└── api.ts                      # (existing) API functions
```

---

## Component Specifications

### 1. Main Orchestrator: `ChatWidget.tsx`

**Responsibility**: Compose views, manage top-level state, handle parent window communication

**Lines Target**: ~200 lines

```tsx
// Simplified structure
export const ChatWidget = (props) => {
  // 1. Top-level state: currentView, isOpen, config
  // 2. Custom hooks for all feature logic
  // 3. Parent window message handling
  // 4. Render: switch on currentView
};
```

### 2. Types: `types.ts`

Extract all interfaces:

```typescript
export interface ChatUser { ... }
export interface Message { ... }
export interface Conversation { ... }
export interface PageVisit { ... }
export type ViewType = 'home' | 'messages' | 'help';
```

### 3. Custom Hooks

#### `useWidgetConfig.ts`
- Config fetching for simple config mode
- Config state management
- Loading states

#### `useConversations.ts`
- Conversation CRUD operations
- localStorage persistence
- Active conversation tracking

#### `useMessages.ts`
- Message state
- Real-time subscription to new messages
- Read receipts management

#### `useRealtime.ts`
- Supabase channel subscriptions
- Status change handling
- Typing indicator subscriptions

#### `usePageTracking.ts`
- Page visit tracking
- Referrer journey capture
- Parent window URL syncing

#### `useVisitorPresence.ts`
- Presence channel management
- Visitor state broadcasting

#### `useAudioRecording.ts`
- MediaRecorder management
- Recording timer
- Stop/cancel logic

#### `useContactForm.ts`
- Form validation
- Spam protection (honeypot, timing)
- Lead creation

### 4. View Components

#### `HomeView.tsx` (~150 lines)
- Gradient background with bubble animation
- Welcome text with scroll fade
- Announcements list
- Quick actions list
- Branding footer

#### `MessagesView.tsx` (~100 lines)
- Conditional: show conversation list OR active chat
- Delegates to child components

#### `ConversationList.tsx` (~80 lines)
- List of previous conversations
- "Start New Conversation" button

#### `HelpView.tsx` (~100 lines)
- Three-level navigation state
- Search input
- Delegates to CategoryList, ArticleList, ArticleContent

### 5. UI Components

#### `MessageBubble.tsx` (~120 lines)
- User vs assistant styling
- Human takeover styling
- System notice styling
- Reactions display
- Read receipts
- Audio player integration

#### `MessageInput.tsx` (~80 lines)
- Text input
- Attachment button
- Voice record button
- Send button
- Disabled state for contact form

#### `ContactForm.tsx` (~150 lines)
- Standard fields (name, email)
- Custom fields rendering
- Phone input with country detection
- Validation & error display
- Honeypot field

#### `TypingIndicator.tsx` (~40 lines)
- Bouncing dots animation
- Human vs AI styling
- Agent name display

#### `TakeoverBanner.tsx` (~30 lines)
- Blue banner with avatar
- Agent name display

---

## Refactoring Phases

### Phase 1: Extract Types & Utils (Low Risk)
**Estimated Effort**: 1-2 hours

1. Create `types.ts` with all interfaces
2. Create `utils/traffic-detection.ts`
3. Create `utils/formatting.ts`
4. Create `constants.ts` with CSS variables
5. Update imports in ChatWidget.tsx

**Testing**: Widget should function identically

### Phase 2: Extract Custom Hooks (Medium Risk)
**Estimated Effort**: 4-6 hours

1. `useAudioRecording.ts` - Most isolated, low dependencies
2. `usePageTracking.ts` - Self-contained tracking logic
3. `useVisitorPresence.ts` - Isolated presence logic
4. `useContactForm.ts` - Form-specific logic
5. `useConversations.ts` - Conversation state management
6. `useMessages.ts` - Message state and subscriptions
7. `useRealtime.ts` - All Supabase subscriptions
8. `useWidgetConfig.ts` - Config fetching

**Testing**: Verify all real-time features, message sending, recording

### Phase 3: Extract UI Components (Medium Risk)
**Estimated Effort**: 3-4 hours

1. `MessageBubble.tsx` - Most reused component
2. `TypingIndicator.tsx` - Small, isolated
3. `TakeoverBanner.tsx` - Small, isolated
4. `MessageInput.tsx` - Input area
5. `ContactForm.tsx` - Form component
6. `BottomNav.tsx` - Navigation tabs
7. `QuickActions.tsx` & `Announcements.tsx`
8. `BrandingFooter.tsx`

**Testing**: Verify all UI interactions, styling

### Phase 4: Extract View Components (Medium Risk)
**Estimated Effort**: 2-3 hours

1. `HomeView.tsx` - Largest view
2. `ConversationList.tsx`
3. `HelpView.tsx` with sub-components
4. `MessagesView.tsx` - Composition component

**Testing**: Verify view transitions, scroll behavior

### Phase 5: Final Cleanup (Low Risk)
**Estimated Effort**: 1-2 hours

1. Review ChatWidget.tsx (~200 lines target)
2. Add barrel exports (`index.ts` files)
3. Remove dead code
4. Add JSDoc comments to hooks

---

## Risk Mitigation

### Testing Strategy

1. **Before Each Phase**: 
   - Document current behavior with screenshots
   - Test all user flows manually

2. **After Each Phase**:
   - Verify same behavior
   - Check bundle size hasn't increased significantly
   - Test real-time features (human takeover, typing indicators)

### Critical Paths to Test

- [ ] New user: Contact form → First message → AI response
- [ ] Returning user: Conversation list → Open conversation → Continue chat
- [ ] Human takeover: Banner appears → Human messages display → Typing indicator
- [ ] Voice recording: Start → Stop → Message sent
- [ ] File attachment: Attach → Preview → Send
- [ ] Help center: Categories → Articles → Feedback
- [ ] Real-time: Messages sync across widget instances

### Rollback Plan

Each phase is atomic. If issues arise:
1. Revert the phase's commits
2. Deploy previous working version
3. Investigate in development environment

---

## Bundle Size Considerations

Current widget bundle: ~50KB gzipped

**Goal**: No increase (ideally slight decrease from tree-shaking)

**Strategies**:
- Keep all lazy loading in place
- Don't add new dependencies
- Use barrel exports sparingly (can prevent tree-shaking)
- Consider dynamic imports for views if needed

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| ChatWidget.tsx lines | 2,489 | <250 |
| Largest component | 2,489 | <200 |
| Files in widget/ | 4 | 25-30 |
| Bundle size (gzipped) | ~50KB | ≤50KB |
| Test coverage | 0% | Ready for unit tests |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Types & Utils | 1-2 hours | None |
| Phase 2: Custom Hooks | 4-6 hours | Phase 1 |
| Phase 3: UI Components | 3-4 hours | Phase 2 |
| Phase 4: View Components | 2-3 hours | Phase 3 |
| Phase 5: Cleanup | 1-2 hours | Phase 4 |
| **Total** | **11-17 hours** | |

---

## Appendix: State Variable Inventory

### Core Widget State
- `config` - Widget configuration
- `loading` - Config loading state
- `isOpen` - Widget open/closed
- `currentView` - 'home' | 'messages' | 'help'
- `isMobileFullScreen` - Mobile detection

### User & Conversation State
- `chatUser` - Current user info
- `activeConversationId` - Current conversation
- `conversations` - All conversations
- `messages` - Current conversation messages
- `showConversationList` - List view toggle

### Real-time State
- `isHumanTakeover` - Takeover status
- `isHumanTyping` - Human typing indicator
- `typingAgentName` - Typing agent name
- `takeoverAgentName` - Takeover agent name
- `takeoverAgentAvatar` - Takeover agent avatar
- `isTyping` - AI typing indicator

### Message Input State
- `messageInput` - Text input value
- `pendingFiles` - Attached files
- `isAttachingFiles` - File picker open
- `isRecordingAudio` - Recording state
- `recordingTime` - Recording duration

### Help Center State
- `selectedCategory` - Current category
- `selectedArticle` - Current article
- `helpSearchQuery` - Search input
- `articleFeedback` - Feedback selection
- `feedbackComment` - Feedback comment
- `showFeedbackComment` - Comment input visible
- `feedbackSubmitted` - Submission status

### Analytics State
- `pageVisits` - Tracked page visits
- `referrerJourney` - Traffic source info
- `visitorId` - Unique visitor ID
- `unreadCount` - Unread message count
- `headerScrollY` - Scroll position

### Form State
- `formErrors` - Validation errors
- `formLoadTime` - Spam protection timestamp

---

## Related Documentation

- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Overall widget system design
- [Animation & Motion Guide](./ANIMATION_MOTION_GUIDE.md) - CSS animation patterns used in widget
- [Database Schema](./DATABASE_SCHEMA.md) - Conversations and messages tables
