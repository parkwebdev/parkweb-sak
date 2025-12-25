# ChatWidget Refactoring Plan

> **Last Updated**: December 2024  
> **Status**: Phase 1 COMPLETE ✅ | Phases 2-9 Ready for Implementation  
> **Priority**: 🟡 MEDIUM  
> **Risk Level**: LOW (documentation/hook extraction only, no UI changes)

## ✅ Phase 1: VERIFIED COMPLETE

**Hook Created**: `src/widget/hooks/useWidgetMessaging.ts` (~490 lines)
**ChatWidget.tsx reduced**: 954 → 605 lines (-349 lines, 37% reduction)
**Barrel exports updated**: `src/widget/hooks/index.ts` with organized sections

Transform `ChatWidget.tsx` from a **954-line monolith** into a **lean ~400-line orchestrator** by extracting inline logic into dedicated hooks. This refactoring:

- **Preserves all existing functionality exactly as-is**
- **Makes zero changes to UI/visuals**
- **Improves maintainability and testability**
- **Follows established widget hook patterns**

---

## Current State Analysis

### ChatWidget.tsx Breakdown (954 lines)

| Section | Lines | Description |
|---------|-------|-------------|
| Imports | 1-60 | Dependencies, hooks, components |
| State declarations | 61-180 | ~30 useState/useRef declarations |
| Hook usage | 181-320 | 13 custom hooks already extracted |
| Effects | 321-380 | useEffect blocks |
| `handleSendMessage` | 383-641 | **258 lines** - Main message logic |
| Audio recording | 659-712 | **53 lines** - Recording functions |
| `handleFormSubmit` | 714-777 | **63 lines** - Form submission |
| Navigation handlers | 778-850 | **72 lines** - View switching |
| Rating logic | 851-880 | **29 lines** - Satisfaction prompts |
| JSX render | 881-954 | View rendering |

### Already Extracted Hooks (13 total)

```
src/widget/hooks/
├── index.ts                    # Barrel exports
├── useWidgetConfig.ts          # Config fetching
├── useConversations.ts         # Conversation CRUD
├── useConversationStatus.ts    # Status subscriptions
├── useRealtimeMessages.ts      # Real-time messages
├── useRealtimeConfig.ts        # Config changes
├── useTypingIndicator.ts       # Typing presence
├── useParentMessages.ts        # postMessage API
├── useSoundSettings.ts         # Sound preferences
├── useVisitorPresence.ts      # Presence tracking
├── useVisitorAnalytics.ts      # Page analytics
├── useKeyboardHeight.ts        # Mobile keyboard
├── useLocationDetection.ts     # Auto-location
└── useSystemTheme.ts           # Theme detection
```

---

## Refactoring Phases

### Phase 1: Extract `useWidgetMessaging` Hook

**Priority**: 🔴 HIGHEST IMPACT  
**Lines to extract**: ~280  
**File**: `src/widget/hooks/useWidgetMessaging.ts`

This is the largest extraction, moving the entire message sending flow:

```typescript
import { useState, useRef, useCallback } from 'react';
import { sendMessage, uploadFiles } from '../api';
import { WidgetConfig, Message, ChatUser, PendingFile } from '../types';
import { widgetLogger } from '../utils/widget-logger';

interface UseWidgetMessagingProps {
  config: WidgetConfig;
  chatUser: ChatUser | null;
  activeConversationId: string | null;
  pageVisits: string[];
  referrerJourney: string | null;
  visitorId: string;
  isOpen: boolean;
  currentView: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setActiveConversationId: (id: string | null) => void;
  setChatUser: (user: ChatUser | null) => void;
  markConversationFetched: (id: string) => void;
}

interface UseWidgetMessagingReturn {
  // State
  messageInput: string;
  setMessageInput: (value: string) => void;
  pendingFiles: PendingFile[];
  setPendingFiles: React.Dispatch<React.SetStateAction<PendingFile[]>>;
  isTyping: boolean;
  newMessageIds: Set<string>;
  
  // Refs (exposed for external access if needed)
  recentChunkIdsRef: React.MutableRefObject<Set<string>>;
  
  // Handlers
  handleSendMessage: (overrideMessage?: string) => Promise<void>;
  handleQuickReplySelectWithSend: (suggestion: string) => void;
}

export function useWidgetMessaging({
  config,
  chatUser,
  activeConversationId,
  pageVisits,
  referrerJourney,
  visitorId,
  isOpen,
  currentView,
  setMessages,
  setActiveConversationId,
  setChatUser,
  markConversationFetched,
}: UseWidgetMessagingProps): UseWidgetMessagingReturn {
  // === State ===
  const [messageInput, setMessageInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  
  // === Refs ===
  const recentChunkIdsRef = useRef<Set<string>>(new Set());
  const quickReplyPendingRef = useRef<string | null>(null);
  const handleSendMessageRef = useRef<(() => void) | null>(null);
  
  // === Main Send Handler ===
  const handleSendMessage = useCallback(async (overrideMessage?: string) => {
    const textToSend = overrideMessage ?? messageInput.trim();
    
    if (!textToSend && pendingFiles.length === 0) {
      widgetLogger.debug('Empty message, skipping send');
      return;
    }
    
    const filesToUpload = [...pendingFiles];
    setPendingFiles([]);

    // Optimistic UI update
    const tempMessageId = `temp_${Date.now()}`;
    const tempMessage: Message = {
      id: tempMessageId,
      conversationId: activeConversationId || 'new',
      text: textToSend,
      sender: 'visitor',
      timestamp: new Date().toISOString(),
      status: 'pending',
      chunks: [],
      fileUploads: filesToUpload.map(file => ({
        name: file.file.name,
        status: 'pending',
        url: URL.createObjectURL(file.file),
      })),
    };

    setMessages((prevMessages) => [...prevMessages, tempMessage]);
    setMessageInput('');

    try {
      // 1. Upload files
      const uploadedFileUrls = await uploadFiles(filesToUpload.map(f => f.file), config.uploadEndpoint);

      // 2. Send message
      const response = await sendMessage(
        textToSend,
        activeConversationId,
        pageVisits,
        referrerJourney,
        visitorId,
        uploadedFileUrls,
      );

      if (!response.body) {
        widgetLogger.error('Empty response body');
        setMessages(prevMessages => prevMessages.map(msg => msg.id === tempMessageId ? { ...msg, status: 'failed' } : msg));
        return;
      }

      // 3. Handle streaming chunks
      const reader = response.body.getReader();
      let partialChunk = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunkText = new TextDecoder().decode(value);
        const fullChunk = partialChunk + chunkText;
        const chunkObjects = fullChunk.split('\n').filter(Boolean).map(item => {
          try {
            return JSON.parse(item);
          } catch (error) {
            widgetLogger.warn('Failed to parse JSON chunk, likely incomplete', { item, error });
            return null;
          }
        }).filter(Boolean);

        if (fullChunk.endsWith('\n')) {
          partialChunk = '';
        } else {
          const lastNewlineIndex = fullChunk.lastIndexOf('\n');
          if (lastNewlineIndex !== -1) {
            partialChunk = fullChunk.substring(lastNewlineIndex + 1);
          } else {
            partialChunk = fullChunk;
          }
        }

        chunkObjects.forEach((chunk) => {
          if (!chunk) return;

          if (chunk.type === 'error') {
            widgetLogger.error('Error chunk received', chunk);
            setMessages(prevMessages => prevMessages.map(msg => msg.id === tempMessageId ? { ...msg, status: 'failed', error: chunk.message } : msg));
            return;
          }

          if (chunk.type === 'conversation_id') {
            const conversationId = chunk.conversation_id;
            widgetLogger.info('Conversation ID received', { conversationId });
            setActiveConversationId(conversationId);
            markConversationFetched(conversationId);
            setMessages(prevMessages => prevMessages.map(msg => msg.id === tempMessageId ? { ...msg, conversationId, status: 'streaming' } : msg));
            return;
          }

          if (chunk.type === 'user') {
            const user = chunk.user;
            widgetLogger.info('User received', { user });
            setChatUser(user);
            return;
          }

          if (chunk.type === 'message') {
            const message = chunk.message;
            if (!message.id) {
              widgetLogger.warn('Missing message ID in chunk', { chunk });
              return;
            }

            if (recentChunkIdsRef.current.has(message.id)) {
              widgetLogger.debug('Duplicate chunk ID, skipping', { id: message.id });
              return;
            }

            recentChunkIdsRef.current.add(message.id);
            setNewMessageIds(prev => new Set(prev).add(message.id));

            setMessages(prevMessages => {
              // 1. Replace temp message
              if (prevMessages.some(m => m.id === tempMessageId)) {
                return prevMessages.map(m => m.id === tempMessageId ? { ...message, status: 'complete' } : m);
              }

              // 2. Append new message
              return [...prevMessages, { ...message, status: 'complete' }];
            });

            return;
          }

          if (chunk.type === 'chunk') {
            const messageId = chunk.message_id;
            const content = chunk.content;

            if (!messageId) {
              widgetLogger.warn('Missing message ID in chunk', { chunk });
              return;
            }

            if (recentChunkIdsRef.current.has(chunk.id)) {
              widgetLogger.debug('Duplicate chunk ID, skipping', { id: chunk.id });
              return;
            }

            recentChunkIdsRef.current.add(chunk.id);
            setNewMessageIds(prev => new Set(prev).add(messageId));

            setMessages(prevMessages => {
              return prevMessages.map(m => {
                if (m.id === messageId) {
                  const updatedChunks = [...m.chunks, content];
                  return { ...m, chunks: updatedChunks, text: updatedChunks.join('') };
                }
                return m;
              });
            });
          }
        });
      }
    } catch (error) {
      widgetLogger.error('Send message failed', error);
      setMessages(prevMessages => prevMessages.map(msg => msg.id === tempMessageId ? { ...msg, status: 'failed', error: (error as Error).message } : msg));
    }
  }, [
    messageInput,
    pendingFiles,
    config,
    chatUser,
    activeConversationId,
    pageVisits,
    referrerJourney,
    visitorId,
    isOpen,
    currentView,
    setMessages,
    setActiveConversationId,
    setChatUser,
    markConversationFetched,
  ]);
  
  // === Quick Reply Handler ===
  const handleQuickReplySelectWithSend = useCallback((suggestion: string) => {
    quickReplyPendingRef.current = suggestion;
    setMessageInput(suggestion);
    
    // Trigger send on next tick after state updates
    setTimeout(() => {
      if (handleSendMessageRef.current) {
        handleSendMessageRef.current();
      }
    }, 0);
  }, []);
  
  // Keep ref updated
  handleSendMessageRef.current = () => handleSendMessage(quickReplyPendingRef.current ?? undefined);
  
  return {
    messageInput,
    setMessageInput,
    pendingFiles,
    setPendingFiles,
    isTyping,
    newMessageIds,
    recentChunkIdsRef,
    handleSendMessage,
    handleQuickReplySelectWithSend,
  };
}
```

**What gets moved**:
- `messageInput` / `setMessageInput` state
- `pendingFiles` / `setPendingFiles` state
- `isTyping` / `setIsTyping` state
- `newMessageIds` state
- `recentChunkIdsRef` ref
- `quickReplyPendingRef` ref
- `handleSendMessageRef` ref
- `handleSendMessage` function (258 lines)
- `handleQuickReplySelectWithSend` function

---

### Phase 2: Extract `useWidgetAudioRecording` Hook

**Priority**: 🟢 MEDIUM  
**Lines to extract**: ~55  
**File**: `src/widget/hooks/useWidgetAudioRecording.ts`

```typescript
import { useState, useRef, useCallback } from 'react';
import { startRecording, stopRecording } from '@/lib/audio-recording';
import { widgetLogger } from '../utils/widget-logger';

interface UseWidgetAudioRecordingReturn {
  isRecordingAudio: boolean;
  recordingTime: number;
  startAudioRecording: () => Promise<void>;
  stopAudioRecording: () => Promise<Blob | null>;
  cancelAudioRecording: () => void;
}

export function useWidgetAudioRecording(): UseWidgetAudioRecordingReturn {
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const startAudioRecording = useCallback(async () => {
    try {
      widgetLogger.info('Starting audio recording');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      widgetLogger.error('Failed to start recording', error);
    }
  }, []);
  
  const stopAudioRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        widgetLogger.info('Recording stopped', { size: blob.size });
        resolve(blob);
      };
      
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      
      setIsRecordingAudio(false);
      setRecordingTime(0);
    });
  }, []);
  
  const cancelAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    
    chunksRef.current = [];
    setIsRecordingAudio(false);
    setRecordingTime(0);
    widgetLogger.debug('Recording cancelled');
  }, []);
  
  return {
    isRecordingAudio,
    recordingTime,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
  };
}
```

**What gets moved**:
- `isRecordingAudio` state
- `recordingTime` state
- `mediaRecorderRef` ref
- `chunksRef` ref
- `recordingIntervalRef` ref
- `startAudioRecording` function
- `stopAudioRecording` function
- `cancelAudioRecording` function

---

### Phase 3: Extract `useWidgetNavigation` Hook

**Priority**: 🟢 MEDIUM  
**Lines to extract**: ~40  
**File**: `src/widget/hooks/useWidgetNavigation.ts`

```typescript
import { useState, useCallback } from 'react';
import { ViewType } from '../types';
import { widgetLogger } from '../utils/widget-logger';

interface UseWidgetNavigationProps {
  chatUser: ChatUser | null;
  setActiveConversationId: (id: string | null) => void;
  setShowConversationList: (show: boolean) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  clearMessagesAndFetch: (conversationId: string) => void;
  markConversationFetched: (id: string) => void;
}

interface UseWidgetNavigationReturn {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  showConversationList: boolean;
  setShowConversationList: (show: boolean) => void;
  handleQuickActionClick: (actionType: string) => void;
  handleMessagesClick: () => void;
  handleStartNewConversation: () => void;
  handleOpenConversation: (conversationId: string) => void;
  handleBackToHome: () => void;
}

export function useWidgetNavigation({
  chatUser,
  setActiveConversationId,
  clearMessagesAndFetch,
  markConversationFetched,
}: UseWidgetNavigationProps): UseWidgetNavigationReturn {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [showConversationList, setShowConversationList] = useState(false);
  
  const handleQuickActionClick = useCallback((actionType: string) => {
    widgetLogger.debug('Quick action clicked', { actionType });
    
    switch (actionType) {
      case 'chat':
        setCurrentView('chat');
        break;
      case 'help':
        setCurrentView('help');
        break;
      case 'news':
        setCurrentView('news');
        break;
      default:
        widgetLogger.warn('Unknown action type', { actionType });
    }
  }, []);
  
  const handleMessagesClick = useCallback(() => {
    setShowConversationList(true);
    setCurrentView('messages');
  }, []);
  
  const handleStartNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setShowConversationList(false);
    setCurrentView('chat');
    widgetLogger.info('Starting new conversation');
  }, [setActiveConversationId]);
  
  const handleOpenConversation = useCallback((conversationId: string) => {
    widgetLogger.info('Opening conversation', { conversationId });
    setActiveConversationId(conversationId);
    markConversationFetched(conversationId);
    clearMessagesAndFetch(conversationId);
    setShowConversationList(false);
    setCurrentView('chat');
  }, [setActiveConversationId, markConversationFetched, clearMessagesAndFetch]);
  
  const handleBackToHome = useCallback(() => {
    setCurrentView('home');
    setShowConversationList(false);
  }, []);
  
  return {
    currentView,
    setCurrentView,
    showConversationList,
    setShowConversationList,
    handleQuickActionClick,
    handleMessagesClick,
    handleStartNewConversation,
    handleOpenConversation,
    handleBackToHome,
  };
}
```

**What gets moved**:
- `currentView` / `setCurrentView` state
- `showConversationList` / `setShowConversationList` state
- `handleQuickActionClick` function
- `handleMessagesClick` function
- `handleStartNewConversation` function
- `handleOpenConversation` function
- `handleBackToHome` function

---

### Phase 4: Extract `useWidgetRating` Hook

**Priority**: 🟢 LOW  
**Lines to extract**: ~25  
**File**: `src/widget/hooks/useWidgetRating.ts`

```typescript
import { useState, useRef, useCallback } from 'react';
import { widgetLogger } from '../utils/widget-logger';

type RatingTriggerType = 'team_closed' | 'ai_marked_complete';

interface UseWidgetRatingReturn {
  showRatingPrompt: boolean;
  ratingTriggerType: RatingTriggerType;
  triggerRating: (type: RatingTriggerType) => void;
  dismissRating: () => void;
  hasShownRating: boolean;
}

export function useWidgetRating(): UseWidgetRatingReturn {
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [ratingTriggerType, setRatingTriggerType] = useState<RatingTriggerType>('ai_marked_complete');
  const hasShownRatingRef = useRef(false);
  
  const triggerRating = useCallback((type: RatingTriggerType) => {
    if (hasShownRatingRef.current) {
      widgetLogger.debug('Rating already shown, skipping');
      return;
    }
    
    widgetLogger.info('Triggering rating prompt', { type });
    setRatingTriggerType(type);
    setShowRatingPrompt(true);
    hasShownRatingRef.current = true;
  }, []);
  
  const dismissRating = useCallback(() => {
    setShowRatingPrompt(false);
    widgetLogger.debug('Rating dismissed');
  }, []);
  
  return {
    showRatingPrompt,
    ratingTriggerType,
    triggerRating,
    dismissRating,
    hasShownRating: hasShownRatingRef.current,
  };
}
```

**What gets moved**:
- `showRatingPrompt` state
- `ratingTriggerType` state
- `hasShownRatingRef` ref
- `triggerRating` function
- `dismissRating` function

---

### Phase 5: Extract `useWidgetTakeover` Hook

**Priority**: 🟢 LOW  
**Lines to extract**: ~15  
**File**: `src/widget/hooks/useWidgetTakeover.ts`

```typescript
import { useState } from 'react';

interface UseWidgetTakeoverReturn {
  isHumanTakeover: boolean;
  setIsHumanTakeover: (value: boolean) => void;
  isHumanTyping: boolean;
  setIsHumanTyping: (value: boolean) => void;
  typingAgentName: string | undefined;
  setTypingAgentName: (name: string | undefined) => void;
  takeoverAgentName: string | undefined;
  setTakeoverAgentName: (name: string | undefined) => void;
  takeoverAgentAvatar: string | undefined;
  setTakeoverAgentAvatar: (avatar: string | undefined) => void;
}

export function useWidgetTakeover(): UseWidgetTakeoverReturn {
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const [isHumanTyping, setIsHumanTyping] = useState(false);
  const [typingAgentName, setTypingAgentName] = useState<string | undefined>();
  const [takeoverAgentName, setTakeoverAgentName] = useState<string | undefined>();
  const [takeoverAgentAvatar, setTakeoverAgentAvatar] = useState<string | undefined>();
  
  return {
    isHumanTakeover,
    setIsHumanTakeover,
    isHumanTyping,
    setIsHumanTyping,
    typingAgentName,
    setTypingAgentName,
    takeoverAgentName,
    setTakeoverAgentName,
    takeoverAgentAvatar,
    setTakeoverAgentAvatar,
  };
}
```

**What gets moved**:
- `isHumanTakeover` state
- `isHumanTyping` state
- `typingAgentName` state
- `takeoverAgentName` state
- `takeoverAgentAvatar` state

---

### Phase 6: Consolidate `handleFormSubmit` into `useWidgetMessaging`

**Priority**: 🟢 LOW  
**Lines to extract**: ~65

Move the form submission handler into `useWidgetMessaging` since it's a special case of sending a greeting:

```typescript
// Add to useWidgetMessaging hook

const handleFormSubmit = useCallback(async (formData: ContactFormData) => {
  widgetLogger.info('Contact form submitted', { 
    hasName: !!formData.name,
    hasEmail: !!formData.email,
    hasPhone: !!formData.phone,
  });
  
  // Create or update chat user
  const newChatUser: ChatUser = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
  };
  setChatUser(newChatUser);
  
  // Trigger AI greeting if configured
  if (config.welcomeMessages?.afterFormSubmit) {
    // ... greeting logic
  }
}, [config, setChatUser]);
```

---

### Phase 7: Update Barrel Exports

**File**: `src/widget/hooks/index.ts`

```typescript
// === Configuration ===
/** Fetches and manages widget configuration */
export { useWidgetConfig } from './useWidgetConfig';
/** Real-time config change subscriptions */
export { useRealtimeConfig } from './useRealtimeConfig';

// === Conversations ===
/** Conversation CRUD operations */
export { useConversations } from './useConversations';
/** Conversation status change subscriptions */
export { useConversationStatus } from './useConversationStatus';

// === Messaging ===
/** Message sending, input state, file handling */
export { useWidgetMessaging } from './useWidgetMessaging';
/** Real-time message subscriptions */
export { useRealtimeMessages } from './useRealtimeMessages';
/** Typing indicator presence */
export { useTypingIndicator } from './useTypingIndicator';

// === Audio ===
/** Audio recording state and controls */
export { useWidgetAudioRecording } from './useWidgetAudioRecording';

// === Navigation ===
/** View navigation and conversation switching */
export { useWidgetNavigation } from './useWidgetNavigation';

// === Ratings ===
/** Satisfaction rating prompt state */
export { useWidgetRating } from './useWidgetRating';

// === Takeover ===
/** Human takeover state consolidation */
export { useWidgetTakeover } from './useWidgetTakeover';

// === Communication ===
/** postMessage API for parent window */
export { useParentMessages } from './useParentMessages';

// === Preferences ===
/** Sound preference persistence */
export { useSoundSettings } from './useSoundSettings';
/** System theme detection */
export { useSystemTheme } from './useSystemTheme';

// === Analytics ===
/** Visitor presence tracking */
export { useVisitorPresence } from './useVisitorPresence';
/** Page visit analytics */
export { useVisitorAnalytics } from './useVisitorAnalytics';

// === Mobile ===
/** Mobile keyboard height detection */
export { useKeyboardHeight } from './useKeyboardHeight';

// === Location ===
/** Auto-detect visitor location */
export { useLocationDetection } from './useLocationDetection';
```

---

### Phase 8: Update Documentation

**File**: `docs/WIDGET_ARCHITECTURE.md`

Update the hooks section:

```markdown
### hooks/ (18 hooks)

| Hook | Purpose | Lines |
|------|---------|-------|
| `useWidgetConfig` | Config fetching and state | ~80 |
| `useRealtimeConfig` | Config change subscriptions | ~40 |
| `useConversations` | Conversation CRUD | ~120 |
| `useConversationStatus` | Status subscriptions | ~50 |
| `useWidgetMessaging` | Message sending, input, files | ~300 |
| `useWidgetAudioRecording` | Voice recording controls | ~80 |
| `useWidgetNavigation` | View navigation | ~60 |
| `useWidgetRating` | Satisfaction rating | ~40 |
| `useWidgetTakeover` | Human takeover state | ~30 |
| `useRealtimeMessages` | Real-time messages | ~100 |
| `useTypingIndicator` | Typing presence | ~60 |
| `useParentMessages` | postMessage API | ~80 |
| `useSoundSettings` | Sound preferences | ~40 |
| `useSystemTheme` | Theme detection | ~30 |
| `useVisitorPresence` | Presence tracking | ~50 |
| `useVisitorAnalytics` | Page analytics | ~60 |
| `useKeyboardHeight` | Mobile keyboard | ~40 |
| `useLocationDetection` | Auto-location | ~50 |
```

---

### Phase 9: Final Cleanup

1. Remove extracted code from `ChatWidget.tsx`
2. Import and wire up new hooks
3. Verify all functionality works identically
4. Run TypeScript compilation check
5. Test all widget modes

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| `ChatWidget.tsx` lines | 954 | ~400 |
| Total hooks | 13 | 18 |
| Average hook size | ~65 lines | ~70 lines |
| Testable units | 13 | 18 |

### ChatWidget.tsx Will Become:

```typescript
// ~400 lines: Pure orchestrator
export function ChatWidget({ config, isContainedPreview }: ChatWidgetProps) {
  // === Hook consumption ===
  const { messageInput, handleSendMessage, ... } = useWidgetMessaging({ ... });
  const { isRecordingAudio, startAudioRecording, ... } = useWidgetAudioRecording();
  const { currentView, handleQuickActionClick, ... } = useWidgetNavigation({ ... });
  const { showRatingPrompt, triggerRating, ... } = useWidgetRating();
  const { isHumanTakeover, ... } = useWidgetTakeover();
  
  // ... other existing hooks
  
  // === Effects (minimal) ===
  // Only orchestration effects remain
  
  // === Render ===
  return (
    <WidgetCard>
      {currentView === 'home' && <HomeView ... />}
      {currentView === 'chat' && <ChatView ... />}
      {currentView === 'help' && <HelpView ... />}
      {currentView === 'news' && <NewsView ... />}
      {showRatingPrompt && <SatisfactionRating ... />}
    </WidgetCard>
  );
}
```

---

## Implementation Order

| Order | Phase | Risk | Time Est. |
|-------|-------|------|-----------|
| 1 | Phase 1: useWidgetMessaging | Medium | 45 min |
| 2 | Phase 2: useWidgetAudioRecording | Low | 15 min |
| 3 | Phase 3: useWidgetNavigation | Low | 20 min |
| 4 | Phase 4: useWidgetRating | Low | 10 min |
| 5 | Phase 5: useWidgetTakeover | Low | 10 min |
| 6 | Phase 6: handleFormSubmit merge | Low | 15 min |
| 7 | Phase 7: Barrel exports | Low | 5 min |
| 8 | Phase 8: Documentation | Low | 10 min |
| 9 | Phase 9: Final cleanup | Low | 15 min |

**Total estimated time**: ~2.5 hours

---

## Verification Checklist

After each phase, verify:

### Functional Testing
- [ ] Widget loads in customer embed mode (production)
- [ ] Widget loads in admin preview mode (AriConfigurator)
- [ ] Widget loads in debug route (/widget)

### View Testing
- [ ] Home view renders correctly
- [ ] Chat view renders correctly
- [ ] Help view renders correctly
- [ ] News view renders correctly
- [ ] Messages list view renders correctly

### Messaging Testing
- [ ] Text messages send correctly
- [ ] File uploads work
- [ ] Voice messages record and send
- [ ] Quick replies auto-send
- [ ] Streaming responses display correctly
- [ ] Typing indicators show

### Feature Testing
- [ ] Human takeover detection works
- [ ] Takeover banner displays
- [ ] Rating prompt appears on completion
- [ ] Sound settings persist
- [ ] Theme detection works

### Technical Testing
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] `widgetLogger` used throughout (no raw console.*)
- [ ] All imports resolve correctly

---

## Rollback Plan

If issues arise during implementation:

1. **Immediate**: Revert to pre-refactor commit
2. **Partial**: Can merge individual phases independently
3. **Testing**: Each phase can be tested in isolation before merging

---

## Non-Goals (Explicitly Out of Scope)

- ❌ Changing any UI/visual elements
- ❌ Modifying component hierarchy
- ❌ Changing API contracts
- ❌ Modifying CSS/styling
- ❌ Adding new features
- ❌ Changing existing behavior
- ❌ Modifying types (except adding hook interfaces)

---

## Success Criteria

1. ✅ `ChatWidget.tsx` reduced to ~400 lines
2. ✅ 5 new hooks created with full TypeScript types
3. ✅ All existing functionality preserved exactly
4. ✅ No visual changes whatsoever
5. ✅ All tests pass (manual verification)
6. ✅ Documentation updated
7. ✅ Barrel exports updated
