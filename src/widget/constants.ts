/**
 * Widget Constants
 * 
 * Shared constants, CSS variables, and lazy-loaded component imports for the ChatWidget.
 */

import { lazy } from 'react';
import type React from 'react';

// ============================================================================
// CSS Variables
// ============================================================================

/**
 * Shared CSS variables to ensure consistent light mode styling across render modes.
 * Widget always uses light mode regardless of parent page theme.
 */
export const WIDGET_CSS_VARS = {
  colorScheme: 'light',
  '--background': '0 0% 100%',
  '--foreground': '0 0% 3.9%',
  '--card': '0 0% 100%',
  '--card-foreground': '0 0% 3.9%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '0 0% 3.9%',
  '--primary': '221.2 83.2% 53.3%',
  '--primary-foreground': '0 0% 98%',
  '--secondary': '0 0% 96.1%',
  '--secondary-foreground': '0 0% 9%',
  '--muted': '0 0% 96.1%',
  '--muted-foreground': '0 0% 45.1%',
  '--accent': '0 0% 96.1%',
  '--accent-foreground': '0 0% 9%',
  '--destructive': '0 84.2% 60.2%',
  '--destructive-foreground': '0 0% 98%',
  '--border': '0 0% 89.8%',
  '--input': '0 0% 89.8%',
  '--ring': '221.2 83.2% 53.3%',
  '--radius': '0.5rem',
} as React.CSSProperties;

// ============================================================================
// Lazy-Loaded Components
// ============================================================================

/**
 * Heavy components lazy-loaded to reduce initial bundle size.
 * These are only loaded when actually needed.
 */

// Voice input for audio recording - WIDGET-NATIVE (no motion/react)
export const VoiceInput = lazy(() => 
  import('./components/WidgetVoiceInput').then(m => ({ default: m.WidgetVoiceInput }))
);

// File drop zone for attachments - WIDGET-NATIVE (no motion/react, no sonner toast)
export const FileDropZone = lazy(() => 
  import('./components/WidgetFileDropZone').then(m => ({ default: m.WidgetFileDropZone }))
);

// Message reactions (emoji reactions on messages) - WIDGET-NATIVE (no Radix, no motion/react)
export const MessageReactions = lazy(() => 
  import('./components/WidgetMessageReactions').then(m => ({ default: m.WidgetMessageReactions }))
);

// Audio player for voice messages - WIDGET-NATIVE (no motion/react)
export const AudioPlayer = lazy(() => 
  import('./components/WidgetAudioPlayer').then(m => ({ default: m.WidgetAudioPlayer }))
);

// Phone input field with country detection - WIDGET-NATIVE (no motion/react)
export const PhoneInputField = lazy(() => 
  import('./components/WidgetPhoneInput').then(m => ({ default: m.WidgetPhoneInput }))
);

// Booking components - only loaded when AI triggers booking flow
export const DayPicker = lazy(() => 
  import('./components/booking/DayPicker').then(m => ({ default: m.DayPicker }))
);

export const TimePicker = lazy(() => 
  import('./components/booking/TimePicker').then(m => ({ default: m.TimePicker }))
);

export const BookingConfirmed = lazy(() => 
  import('./components/booking/BookingConfirmed').then(m => ({ default: m.BookingConfirmed }))
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Detect mobile full-screen mode (matches media query in pilot-widget.js)
 */
export const getIsMobileFullScreen = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 480;
};

/**
 * Check if URL is internal widget URL (should not be tracked in analytics)
 */
export const isInternalWidgetUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.includes('widget.html') || urlObj.pathname.includes('widget-entry');
  } catch {
    return url.includes('widget.html') || url.includes('widget-entry');
  }
};

// ============================================================================
// Position Classes
// ============================================================================

/**
 * CSS classes for widget positioning based on config.position value
 */
export const positionClasses = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
} as const;

export type WidgetPosition = keyof typeof positionClasses;
