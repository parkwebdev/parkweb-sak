/**
 * Error Codes & Error Response Handling
 * Provides consistent error responses across all edge functions.
 * 
 * @module _shared/errors
 * @description Defines error codes and creates standardized error responses
 * with proper CORS headers and JSON structure.
 * 
 * @example
 * ```typescript
 * import { ErrorCodes, createErrorResponse } from "../_shared/errors.ts";
 * 
 * // Return a validation error
 * return createErrorResponse(
 *   requestId,
 *   ErrorCodes.INVALID_REQUEST,
 *   'Message content is required',
 *   400
 * );
 * 
 * // Return with timing
 * return createErrorResponse(
 *   requestId,
 *   ErrorCodes.AI_PROVIDER_ERROR,
 *   'Failed to generate response',
 *   500,
 *   performance.now() - startTime
 * );
 * ```
 */

import { corsHeaders } from "./cors.ts";

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
// REQUEST SIZE LIMITS
// ============================================

/** Maximum message length in characters (10,000) */
export const MAX_MESSAGE_LENGTH = 10000;

/** Maximum number of files per message */
export const MAX_FILES_PER_MESSAGE = 5;

// ============================================
// ERROR RESPONSE CREATOR
// ============================================

/**
 * Create an error response with consistent structure.
 * 
 * @param requestId - Unique request identifier for correlation
 * @param code - Error code from ErrorCodes
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param durationMs - Optional request duration in milliseconds
 * @returns Response object with JSON error body and CORS headers
 */
export function createErrorResponse(
  requestId: string,
  code: ErrorCode,
  message: string,
  status: number,
  durationMs?: number
): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      code,
      requestId,
      ...(durationMs !== undefined && { durationMs: Math.round(durationMs) }),
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
