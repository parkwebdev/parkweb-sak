/**
 * Tool Type Definitions
 * Shared types for tool execution and results.
 * 
 * @module _shared/types/tools
 */

import type { ConversationMetadata } from '../types.ts';

// ============================================
// TOOL RESULT TYPES
// ============================================

/**
 * Generic tool execution result.
 * Use for consistent tool return types.
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
}

// ============================================
// MESSAGE & TOOL CALL TYPES
// ============================================

/**
 * Tool message from cache or history.
 */
export interface ToolMessage {
  role: 'tool';
  tool_call_id: string;
  content: string;
  timestamp?: string;
  name?: string;
  success?: boolean;
  result?: unknown;
  arguments?: unknown;
}

/**
 * Tool call structure from OpenAI-style API.
 */
export interface ToolCallStructure {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * AI assistant message with optional tool calls.
 */
export interface AssistantMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: ToolCallStructure[];
}

/**
 * AI request body for OpenRouter/OpenAI.
 */
export interface AIRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  temperature: number;
  max_completion_tokens: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  top_k?: number;
  tools?: unknown[];
  tool_choice?: string | Record<string, unknown>;
}

/**
 * Enabled tool configuration for AI.
 */
export interface EnabledToolConfig {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  endpoint_url: string | null;
  headers: Record<string, string> | null;
  timeout_ms: number | null;
}

/**
 * Tool execution options.
 */
export interface ToolExecutionOptions {
  assistantMessage: AssistantMessage;
  assistantContent: string;
  aiRequestBody: AIRequestBody;
  activeConversationId: string;
  agentId: string;
  supabaseUrl: string;
  enabledTools: EnabledToolConfig[];
  previewMode: boolean;
  conversationMetadata: ConversationMetadata;
  openRouterApiKey: string;
}

// ============================================
// SCHEDULED REPORT TYPES
// ============================================

/**
 * Scheduled report configuration.
 */
export interface ScheduledReportConfig {
  format: 'csv' | 'pdf';
  startDate: string;
  endDate: string;
  type?: 'summary' | 'detailed' | 'comparison';
  grouping?: 'day' | 'week' | 'month';
  filters?: {
    agentId?: string;
    leadStatus?: string;
  };
  includeKPIs?: boolean;
  includeCharts?: boolean;
  includeTables?: boolean;
  includeConversations?: boolean;
  includeLeads?: boolean;
  includeBookings?: boolean;
  includeSatisfaction?: boolean;
  includeTrafficSources?: boolean;
  includeTopPages?: boolean;
}

/**
 * Scheduled report from database.
 */
export interface ScheduledReport {
  id: string;
  user_id: string;
  name: string;
  recipients: string[];
  frequency: string;
  timezone?: string;
  time_of_day: string;
  day_of_week?: number;
  day_of_month?: number;
  report_config: ScheduledReportConfig;
  profiles?: {
    display_name: string | null;
    company_name: string | null;
  };
}

// ============================================
// BOOKING TYPES
// ============================================

/**
 * Available time slot for booking.
 */
export interface AvailableSlot {
  start: string;
  end: string;
}

/**
 * Location information for bookings.
 */
export interface BookingLocation {
  id: string;
  name: string;
  timezone: string;
}

/**
 * Booking confirmation details.
 */
export interface BookingConfirmation {
  id: string;
  start_time: string;
  end_time: string;
  location_name: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
}

/**
 * Result from booking tool execution.
 */
export interface BookingToolResult {
  available_slots?: AvailableSlot[];
  location?: BookingLocation;
  booking?: BookingConfirmation;
}

// ============================================
// PROPERTY TYPES
// ============================================

/**
 * Property row from database query.
 * Matches the properties table schema.
 */
export interface PropertyRow {
  id: string;
  external_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  price: number | null;
  price_type: 'sale' | 'rent_monthly' | 'rent_weekly' | null;
  status: 'available' | 'pending' | 'sold' | 'rented' | 'coming_soon' | null;
  description: string | null;
  features: string[] | null;
  images: unknown | null;
  listing_url: string | null;
  location_id: string | null;
  lot_number: string | null;
  year_built: number | null;
}

/**
 * Shown property for chat context.
 * Matches ConversationMetadata.shown_properties structure.
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
  location_id: string | null;
}

// ============================================
// CALENDAR TYPES
// ============================================

/**
 * Calendar event from database.
 */
export interface CalendarEventRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean | null;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | null;
  location_id: string | null;
  connected_account_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  notes: string | null;
  metadata: unknown | null;
}

// ============================================
// WEBHOOK TYPES
// ============================================

/**
 * Event payload for webhook dispatch.
 */
export interface EventPayload {
  type: 'insert' | 'update' | 'delete';
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
}
