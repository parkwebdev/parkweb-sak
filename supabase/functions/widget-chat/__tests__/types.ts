/**
 * Widget-Chat Snapshot Test Types
 * 
 * Type definitions for the snapshot test suite.
 * These mirror the actual request/response schemas from the edge function.
 * 
 * @module widget-chat/__tests__/types
 */

// ============================================
// REQUEST TYPES
// ============================================

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface PageVisit {
  url: string;
  title?: string;
  timestamp: string;
  duration?: number;
}

export interface ReferrerJourney {
  referrer?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface WidgetChatRequest {
  agentId: string;
  conversationId?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    files?: FileAttachment[];
  }>;
  leadId?: string;
  pageVisits?: PageVisit[];
  referrerJourney?: ReferrerJourney;
  visitorId?: string;
  previewMode?: boolean;
  browserLanguage?: string;
  turnstileToken?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface KnowledgeSource {
  id: string;
  source: string;
  content: string;
  similarity: number;
}

export interface ToolUsed {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface CallAction {
  phone: string;
  display: string;
  location?: string;
  locationId?: string;
}

export interface DayPickerData {
  title: string;
  subtitle?: string;
  days: Array<{
    date: string;
    dayName: string;
    available: boolean;
  }>;
  locationId?: string;
  locationName?: string;
}

export interface TimePickerData {
  title: string;
  subtitle?: string;
  selectedDate: string;
  times: Array<{
    time: string;
    available: boolean;
  }>;
  locationId?: string;
  locationName?: string;
}

export interface BookingConfirmationData {
  title: string;
  subtitle?: string;
  date: string;
  time: string;
  locationName?: string;
  confirmationNumber?: string;
}

export interface WidgetChatResponse {
  conversationId: string | null;
  requestId: string;
  messages: Array<{
    id: string;
    content: string;
    chunkIndex: number;
  }>;
  response: string;
  userMessageId?: string;
  assistantMessageId?: string;
  sources?: KnowledgeSource[];
  toolsUsed?: ToolUsed[];
  linkPreviews?: LinkPreview[];
  quickReplies?: string[];
  callActions?: CallAction[];
  dayPicker?: DayPickerData;
  timePicker?: TimePickerData;
  bookingConfirmed?: BookingConfirmationData;
  aiMarkedComplete?: boolean;
  durationMs: number;
  cached?: boolean;
  similarity?: number;
  status?: 'active' | 'closed' | 'human_takeover';
  takenOverBy?: string;
}

export interface WidgetChatErrorResponse {
  error: string;
  code: ErrorCode;
  requestId: string;
  durationMs?: number;
  details?: Record<string, unknown>;
}

// ============================================
// ERROR CODES
// ============================================

export const ErrorCodes = {
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  INVALID_REQUEST: 'INVALID_REQUEST',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  EMBEDDING_ERROR: 'EMBEDDING_ERROR',
  TOOL_EXECUTION_ERROR: 'TOOL_EXECUTION_ERROR',
  CONVERSATION_CLOSED: 'CONVERSATION_CLOSED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// TEST UTILITIES
// ============================================

export interface TestContext {
  supabaseUrl: string;
  supabaseKey: string;
  functionUrl: string;
  testAgentId: string;
}

export interface SnapshotTestCase {
  id: string;
  name: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  request: Partial<WidgetChatRequest>;
  expectedStatus: number;
  expectedFields: string[];
  assertions: (response: WidgetChatResponse | WidgetChatErrorResponse) => void;
}

// ============================================
// REQUEST SIZE CONSTANTS
// ============================================

export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_FILES_PER_MESSAGE = 5;
