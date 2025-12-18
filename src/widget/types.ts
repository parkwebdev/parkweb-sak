/**
 * Widget Types
 * 
 * Central type definitions for the ChatWidget component and related functionality.
 * These types are internal to the widget and separate from the API types defined in api.ts.
 */

import type { WidgetConfig } from './api';

// ============================================================================
// View & Navigation Types
// ============================================================================

/**
 * Available view types in the widget navigation
 */
export type ViewType = 'home' | 'messages' | 'help' | 'news';

// ============================================================================
// User & Conversation Types
// ============================================================================

/**
 * User information captured from the contact form
 */
export interface ChatUser {
  firstName: string;
  lastName: string;
  email: string;
  leadId: string;
  conversationId?: string; // Database conversation ID
}

/**
 * Message in a conversation
 */
export interface Message {
  id?: string; // Database message ID for reactions
  tempId?: string; // Temporary ID for tracking optimistic messages
  role: 'user' | 'assistant';
  content: string;
  read?: boolean;
  read_at?: string; // ISO timestamp when message was read
  timestamp: Date;
  type?: 'text' | 'audio' | 'file';
  audioUrl?: string;
  files?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  reactions?: Array<{ 
    emoji: string; 
    count: number; 
    userReacted: boolean; 
    adminReacted?: boolean 
  }>;
  isSystemNotice?: boolean; // For takeover notices - no timestamp, no emoji, no avatar
  isHuman?: boolean;
  senderName?: string;
  senderAvatar?: string;
  linkPreviews?: Array<any>; // Cached link previews from message metadata
  failed?: boolean; // Message failed to send
  quickReplies?: string[]; // AI-suggested follow-up actions
  callActions?: Array<{ phoneNumber: string; displayNumber: string; locationName?: string }>; // Call buttons for phone numbers
  dayPicker?: DayPickerData; // Step 1: Day selection for booking
  timePicker?: TimePickerData; // Step 2: Time selection for booking
  bookingConfirmed?: BookingConfirmationData; // Step 3: Booking confirmation
}

// ============================================================================
// Booking Flow Types
// ============================================================================

/**
 * A single day option in the day picker
 */
export interface BookingDay {
  date: string; // ISO date string (YYYY-MM-DD)
  dayName: string; // Abbreviated day name (e.g., "Wed")
  dayNumber: number; // Day of month (e.g., 18)
  hasAvailability: boolean; // Whether there are available slots
  isToday?: boolean;
}

/**
 * A single time slot option in the time picker
 */
export interface BookingTime {
  time: string; // Display time (e.g., "9 AM")
  datetime: string; // ISO datetime string for booking
  available: boolean;
}

/**
 * Data for the day picker component (Step 1)
 */
export interface DayPickerData {
  locationName: string;
  locationId: string;
  phoneNumber?: string; // For empty state fallback
  days: BookingDay[];
  selectedDate?: string;
}

/**
 * Data for the time picker component (Step 2)
 */
export interface TimePickerData {
  locationName: string;
  locationId: string;
  phoneNumber?: string; // For empty state fallback
  selectedDate: string; // ISO date string
  selectedDayDisplay: string; // e.g., "Wednesday, December 18"
  times: BookingTime[];
}

/**
 * Data for the booking confirmation card (Step 3)
 */
export interface BookingConfirmationData {
  locationName: string;
  address?: string; // Physical address
  phoneNumber?: string; // Contact phone number
  date: string; // Formatted date display
  time: string; // Formatted time display
  startDateTime?: string; // ISO datetime for calendar URLs
  endDateTime?: string; // ISO datetime for calendar URLs
  confirmationId?: string;
}

/**
 * Conversation with messages for the conversation list
 */
export interface Conversation {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  preview: string;
}

/**
 * Pending file attachment before sending
 */
export interface PendingFile {
  file: File;
  preview: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

/**
 * Tracked page visit for visitor analytics
 */
export interface PageVisit {
  url: string;
  entered_at: string;
  duration_ms: number;
}

// ============================================================================
// Props Types
// ============================================================================

/**
 * Props for the ChatWidget component
 */
export interface ChatWidgetProps {
  config: WidgetConfig | { agentId: string; position?: string; primaryColor?: string };
  previewMode?: boolean;
  containedPreview?: boolean;
  embeddedPreview?: boolean; // Full-panel embedded mode (no floating button, always visible)
  isLoading?: boolean; // When true, show skeleton placeholders for dynamic content
}

/** Simple config with only agentId for lazy loading */
export interface SimpleWidgetConfig {
  agentId: string;
  position?: string;
  primaryColor?: string;
}

/** Message metadata stored in messages.metadata for widget context */
export interface WidgetMessageMetadata {
  files?: Array<{ name: string; url: string; type: string; size: number }>;
  reactions?: Array<{ emoji: string; count: number; userReacted: boolean; adminReacted?: boolean }>;
  sender_type?: 'human' | 'ai';
  sender_name?: string;
  sender_avatar?: string;
  read_at?: string;
  link_previews?: Array<{
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    favicon?: string;
    domain: string;
  }>;
  pending?: boolean;
  source?: string;
  /** Chunk index for multi-message responses (0-based) */
  chunk_index?: number;
  /** Total number of chunks in this response */
  chunk_total?: number;
}
