/**
 * Response Chunking Utilities
 * Split AI responses into message chunks for chat display.
 * 
 * @module _shared/utils/response-chunking
 * @description Handles splitting AI responses using ||| delimiter.
 * 
 * @example
 * ```typescript
 * import { splitResponseIntoChunks } from "../_shared/utils/response-chunking.ts";
 * 
 * const response = "Hello!|||How can I help you today?|||Let me know what you need.";
 * const chunks = splitResponseIntoChunks(response);
 * // ["Hello!", "How can I help you today?", "Let me know what you need."]
 * ```
 */

// ============================================
// RESPONSE CHUNKING
// ============================================

/** Default delimiter for splitting AI responses into multiple messages */
export const RESPONSE_DELIMITER = '|||';

/** Maximum number of chunks to return */
export const DEFAULT_MAX_CHUNKS = 4;

/**
 * Split AI response into message chunks using ||| delimiter
 * 
 * @param response - Full AI response text
 * @param maxChunks - Maximum number of chunks to return (default: 4)
 * @returns Array of message chunks
 */
export function splitResponseIntoChunks(response: string, maxChunks: number = DEFAULT_MAX_CHUNKS): string[] {
  // If no delimiter, return as single chunk
  if (!response.includes(RESPONSE_DELIMITER)) {
    return [response.trim()];
  }
  
  // Split on delimiter
  const chunks = response
    .split(RESPONSE_DELIMITER)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0);
  
  // Cap at maxChunks
  return chunks.slice(0, maxChunks);
}
