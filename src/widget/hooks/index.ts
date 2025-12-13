/**
 * Widget Hooks
 * 
 * Custom React hooks for managing widget state and side effects.
 * Each hook is focused on a specific concern for maintainability.
 * 
 * @module widget/hooks
 * 
 * @example
 * import { useWidgetConfig, useSoundSettings } from '@/widget/hooks';
 */

/** Widget configuration management and loading states */
export { useWidgetConfig } from './useWidgetConfig';

/** Sound preference persistence to localStorage */
export { useSoundSettings } from './useSoundSettings';

/** Visitor ID generation and page tracking analytics */
export { useVisitorAnalytics } from './useVisitorAnalytics';

/** Parent window postMessage communication for iframe mode */
export { useParentMessages } from './useParentMessages';

/** Real-time message subscriptions via Supabase */
export { useRealtimeMessages } from './useRealtimeMessages';

/** Human takeover status detection and notifications */
export { useConversationStatus } from './useConversationStatus';

/** Typing indicator state management */
export { useTypingIndicator } from './useTypingIndicator';

/** Real-time visitor presence broadcasting */
export { useVisitorPresence } from './useVisitorPresence';

/** Conversation CRUD operations and localStorage persistence */
export { useConversations } from './useConversations';

/** Real-time config updates via Supabase */
export { useRealtimeConfig } from './useRealtimeConfig';

/** Mobile keyboard height detection for viewport adjustments */
export { useKeyboardHeight } from './useKeyboardHeight';

/** System theme detection for mobile dark mode updates */
export { useSystemTheme } from './useSystemTheme';

/** Smart location detection from URL patterns and WordPress API */
export { useLocationDetection } from './useLocationDetection';
