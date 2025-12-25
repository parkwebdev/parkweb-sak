/**
 * Widget Hooks
 * 
 * Custom React hooks for managing widget state and side effects.
 * Each hook is focused on a specific concern for maintainability.
 * 
 * @module widget/hooks
 * 
 * @example
 * import { useWidgetConfig, useSoundSettings, useWidgetMessaging } from '@/widget/hooks';
 */

// ============================================================================
// Configuration Hooks
// ============================================================================

/** Widget configuration management and loading states */
export { useWidgetConfig } from './useWidgetConfig';

/** Real-time config updates via Supabase */
export { useRealtimeConfig } from './useRealtimeConfig';

// ============================================================================
// Messaging Hooks
// ============================================================================

/** 
 * Message sending, input state, file handling, form submission
 * @see useWidgetMessaging - Phase 1 refactor (extracted from ChatWidget.tsx)
 */
export { useWidgetMessaging } from './useWidgetMessaging';

/** Conversation CRUD operations and localStorage persistence */
export { useConversations } from './useConversations';

/** Real-time message subscriptions via Supabase */
export { useRealtimeMessages } from './useRealtimeMessages';

/** Human takeover status detection and notifications */
export { useConversationStatus } from './useConversationStatus';

/** Typing indicator state management */
export { useTypingIndicator } from './useTypingIndicator';

// ============================================================================
// Audio Hooks
// ============================================================================

/**
 * Audio recording state and controls
 * @see useWidgetAudioRecording - Phase 2 refactor (extracted from ChatWidget.tsx)
 */
export { useWidgetAudioRecording } from './useWidgetAudioRecording';

// ============================================================================
// Communication Hooks
// ============================================================================

/** Parent window postMessage communication for iframe mode */
export { useParentMessages } from './useParentMessages';

// ============================================================================
// Analytics & Presence Hooks
// ============================================================================

/** Visitor ID generation and page tracking analytics */
export { useVisitorAnalytics } from './useVisitorAnalytics';

/** Real-time visitor presence broadcasting */
export { useVisitorPresence } from './useVisitorPresence';

// ============================================================================
// Preference Hooks
// ============================================================================

/** Sound preference persistence to localStorage */
export { useSoundSettings } from './useSoundSettings';

/** System theme detection for mobile dark mode updates */
export { useSystemTheme } from './useSystemTheme';

// ============================================================================
// Mobile & Location Hooks
// ============================================================================

/** Mobile keyboard height detection for viewport adjustments */
export { useKeyboardHeight } from './useKeyboardHeight';

/** Smart location detection from URL patterns and WordPress API */
export { useLocationDetection } from './useLocationDetection';
