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

/** 
 * Widget-specific conversation state management
 * NOTE: Renamed from useConversations to avoid confusion with admin hook
 */
export { useWidgetConversations } from './useWidgetConversations';

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
// Navigation Hooks
// ============================================================================

/**
 * View navigation state and handlers
 * @see useWidgetNavigation - Phase 3 refactor (extracted from ChatWidget.tsx)
 */
export { useWidgetNavigation } from './useWidgetNavigation';

// ============================================================================
// Rating Hooks
// ============================================================================

/**
 * Satisfaction rating prompt state and handlers
 * @see useWidgetRating - Phase 4 refactor (extracted from useWidgetMessaging)
 */
export { useWidgetRating } from './useWidgetRating';

// ============================================================================
// Takeover Hooks
// ============================================================================

/**
 * Human takeover and typing indicator state
 * @see useWidgetTakeover - Phase 5 refactor (extracted from useWidgetMessaging + ChatWidget)
 */
export { useWidgetTakeover } from './useWidgetTakeover';

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
