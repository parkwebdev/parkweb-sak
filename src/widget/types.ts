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
export type ViewType = 'home' | 'messages' | 'help';

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
  isLoading?: boolean; // When true, show skeleton placeholders for dynamic content
}
