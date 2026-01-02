/**
 * Tool Cache Module
 * Redundant tool call prevention via conversation history.
 * 
 * @module _shared/memory/tool-cache
 * @description Prevents duplicate tool calls within a time window.
 * 
 * @example
 * ```typescript
 * import { findCachedToolResult, getRecentToolCalls, type CachedToolResult } from "../_shared/memory/tool-cache.ts";
 * 
 * const recentMessages = await getRecentToolCalls(supabase, conversationId);
 * const cached = findCachedToolResult(recentMessages, "search_properties", args);
 * if (cached) {
 *   // Use cached result instead of calling tool again
 * }
 * ```
 */

import type { DbMessage } from './conversation-history.ts';

// ============================================
// TYPES
// ============================================

export interface CachedToolResult {
  toolName: string;
  arguments: any;
  result: any;
  success: boolean;
  timestamp: string;
}

// ============================================
// TOOL ARGUMENT NORMALIZATION
// ============================================

/**
 * Normalize tool arguments for comparison.
 * Sorts object keys and handles common variations.
 * 
 * @param args - Tool arguments object
 * @returns Normalized JSON string for comparison
 */
export function normalizeToolArgs(args: any): string {
  if (!args || typeof args !== 'object') {
    return JSON.stringify(args || {});
  }
  
  // Sort keys and normalize values
  const sorted: Record<string, any> = {};
  const keys = Object.keys(args).sort();
  
  for (const key of keys) {
    let value = args[key];
    
    // Normalize string values (lowercase, trim)
    if (typeof value === 'string') {
      value = value.toLowerCase().trim();
    }
    
    // Skip undefined/null values
    if (value !== undefined && value !== null && value !== '') {
      sorted[key] = value;
    }
  }
  
  return JSON.stringify(sorted);
}

// ============================================
// CACHE LOOKUP
// ============================================

/**
 * Check if a tool call is redundant (same tool + similar args within time window).
 * Returns cached result if found, null otherwise.
 * 
 * @param dbMessages - Recent database messages to search
 * @param toolName - Name of tool being called
 * @param toolArgs - Arguments for the tool call
 * @param maxAgeMinutes - Time window for cache validity (default: 10 minutes)
 * @returns Cached result or null
 */
export function findCachedToolResult(
  dbMessages: DbMessage[],
  toolName: string,
  toolArgs: any,
  maxAgeMinutes: number = 10
): CachedToolResult | null {
  const normalizedArgs = normalizeToolArgs(toolArgs);
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  
  // Look through messages for matching tool calls and their results
  for (let i = dbMessages.length - 1; i >= 0; i--) {
    const msg = dbMessages[i];
    
    // Skip if not a tool call
    if (msg.role !== 'assistant' || !msg.tool_name || !msg.tool_arguments) {
      continue;
    }
    
    // Skip if older than max age
    const msgTime = new Date(msg.created_at);
    if (msgTime < cutoffTime) {
      continue;
    }
    
    // Skip if different tool
    if (msg.tool_name !== toolName) {
      continue;
    }
    
    // Check if arguments match
    const storedNormalizedArgs = normalizeToolArgs(msg.tool_arguments);
    if (storedNormalizedArgs !== normalizedArgs) {
      continue;
    }
    
    // Found matching tool call - now find the corresponding result
    // The result should be the next 'tool' role message with matching tool_call_id
    const toolCallId = msg.tool_call_id;
    
    for (let j = i + 1; j < dbMessages.length; j++) {
      const resultMsg = dbMessages[j];
      if (resultMsg.role === 'tool' && resultMsg.tool_call_id === toolCallId) {
        console.log(`TOOL CACHE: Found cached result for ${toolName} (${maxAgeMinutes}min window)`);
        return {
          toolName: msg.tool_name,
          arguments: msg.tool_arguments,
          result: resultMsg.tool_result,
          success: resultMsg.metadata?.tool_success !== false,
          timestamp: msg.created_at,
        };
      }
    }
  }
  
  return null;
}

/**
 * Get all recent tool results from conversation history for cache lookup.
 * 
 * @param supabase - Supabase client
 * @param conversationId - Conversation UUID
 * @param maxAgeMinutes - Time window for recent messages (default: 10 minutes)
 * @returns Array of recent messages with tool data
 */
export async function getRecentToolCalls(
  supabase: any,
  conversationId: string,
  maxAgeMinutes: number = 10
): Promise<DbMessage[]> {
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at, tool_call_id, tool_name, tool_arguments, tool_result')
    .eq('conversation_id', conversationId)
    .gte('created_at', cutoffTime)
    .in('role', ['assistant', 'tool'])
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching recent tool calls:', error);
    return [];
  }
  
  return messages || [];
}
