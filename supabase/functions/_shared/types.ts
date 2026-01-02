/**
 * Shared Types & Interfaces
 * Common type definitions used across edge functions.
 * 
 * @module _shared/types
 * @description Provides type definitions for conversation metadata,
 * property display, phone actions, and utility regex patterns.
 * 
 * @example
 * ```typescript
 * import { ConversationMetadata, ShownProperty, URL_REGEX } from "../_shared/types.ts";
 * 
 * const metadata: ConversationMetadata = {
 *   lead_name: 'John Doe',
 *   lead_email: 'john@example.com',
 * };
 * 
 * const urls = content.match(URL_REGEX) || [];
 * ```
 */

// ============================================
// PROPERTY TYPES
// ============================================

/**
 * Property data shown to visitors in chat.
 * Used for property context memory in multi-property scenarios.
 */
export interface ShownProperty {
  index: number;
  id: string;
  address: string;
  city: string;
  state: string;
  beds: number | null;
  baths: number | null;
  price: number | null;
  price_formatted: string;
  community: string | null;
  /** For direct booking without location lookup */
  location_id: string | null;
}

// ============================================
// CONVERSATION METADATA
// ============================================

/**
 * Metadata stored with each conversation.
 * Edge functions can't import from src/, so this is defined locally.
 */
export interface ConversationMetadata {
  lead_name?: string;
  lead_email?: string;
  custom_fields?: Record<string, string | number | boolean>;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  landing_page?: string;
  visited_pages?: string[];
  session_id?: string;
  ip_address?: string;
  last_message_at?: string;
  last_message_role?: string;
  last_user_message_at?: string;
  admin_last_read_at?: string;
  lead_id?: string;
  /** Property context memory for multi-property scenarios */
  shown_properties?: ShownProperty[];
  last_property_search_at?: string;
  /** PHASE 2: Conversation summarization for context continuity */
  conversation_summary?: string;
  summary_generated_at?: string;
  /** Language detection for translation banner */
  detected_language_code?: string;  // ISO code: 'es', 'fr', 'pt', etc.
  detected_language?: string;       // Full name: 'Spanish', 'French', etc.
}

// ============================================
// PHONE/CALL TYPES
// ============================================

/**
 * Phone number extracted from content for call buttons.
 */
export interface CallAction {
  /** For tel: href (E.164 or raw) */
  phoneNumber: string;
  /** Human-readable format */
  displayNumber: string;
  /** Context from location data */
  locationName?: string;
}

// ============================================
// REGEX PATTERNS
// ============================================

/** URL regex for extracting links from content */
export const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

/**
 * US Phone number regex.
 * Matches: (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx.xxx.xxxx, +1 xxx xxx xxxx, etc.
 */
export const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?([2-9][0-9]{2})\)?[-.\s]?([2-9][0-9]{2})[-.\s]?([0-9]{4})\b/g;
