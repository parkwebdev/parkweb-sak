/**
 * Conversation History Module
 * Database-first message fetching and tool persistence.
 * 
 * @module _shared/memory/conversation-history
 * @description Fetch and persist conversation messages including tool calls.
 * 
 * @example
 * ```typescript
 * import { 
 *   fetchConversationHistory, 
 *   persistToolCall, 
 *   persistToolResult,
 *   type DbMessage 
 * } from "../_shared/memory/conversation-history.ts";
 * 
 * const history = await fetchConversationHistory(supabase, conversationId);
 * await persistToolCall(supabase, conversationId, toolCallId, toolName, args);
 * await persistToolResult(supabase, conversationId, toolCallId, toolName, result, true);
 * ```
 */

// ============================================
// TYPES
// ============================================

export interface DbMessage {
  id: string;
  role: string;
  content: string;
  metadata: any;
  created_at: string;
  tool_call_id: string | null;
  tool_name: string | null;
  tool_arguments: any | null;
  tool_result: any | null;
}

// ============================================
// CONVERSATION HISTORY
// ============================================

/**
 * Fetch conversation history from database and convert to OpenAI message format.
 * This is the source of truth - we no longer trust client-provided message history.
 * 
 * @param supabase - Supabase client
 * @param conversationId - Conversation UUID
 * @param limit - Maximum messages to fetch (default: 50)
 * @returns OpenAI-formatted message array
 */
export async function fetchConversationHistory(
  supabase: any,
  conversationId: string,
  limit: number = 50
): Promise<any[]> {
  const { data: dbMessages, error } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at, tool_call_id, tool_name, tool_arguments, tool_result')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }

  if (!dbMessages || dbMessages.length === 0) {
    return [];
  }

  // Convert database messages to OpenAI format
  return convertDbMessagesToOpenAI(dbMessages);
}

/**
 * Convert database messages to OpenAI API format.
 * Handles regular messages, tool calls, and tool results.
 * 
 * @param dbMessages - Array of database message records
 * @returns OpenAI-formatted message array
 */
export function convertDbMessagesToOpenAI(dbMessages: DbMessage[]): any[] {
  const openAIMessages: any[] = [];

  for (const msg of dbMessages) {
    // Tool result message (response from tool execution)
    if (msg.role === 'tool' && msg.tool_call_id) {
      openAIMessages.push({
        role: 'tool',
        tool_call_id: msg.tool_call_id,
        content: msg.content,
      });
      continue;
    }

    // Assistant message with tool calls
    if (msg.role === 'assistant' && msg.tool_name && msg.tool_arguments) {
      // This is a tool call message - the assistant requested a tool
      const toolCallId = msg.tool_call_id || `call_${msg.id}`;
      openAIMessages.push({
        role: 'assistant',
        content: msg.content || null,
        tool_calls: [{
          id: toolCallId,
          type: 'function',
          function: {
            name: msg.tool_name,
            arguments: typeof msg.tool_arguments === 'string' 
              ? msg.tool_arguments 
              : JSON.stringify(msg.tool_arguments),
          }
        }]
      });
      continue;
    }

    // Regular user/assistant message
    openAIMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  return openAIMessages;
}

// ============================================
// TOOL PERSISTENCE
// ============================================

/**
 * Persist a tool call to the database.
 * Called when AI requests a tool execution.
 * 
 * @param supabase - Supabase client
 * @param conversationId - Conversation UUID
 * @param toolCallId - Unique tool call identifier
 * @param toolName - Name of the tool being called
 * @param toolArguments - Arguments passed to the tool
 * @returns Message ID or null on error
 */
export async function persistToolCall(
  supabase: any,
  conversationId: string,
  toolCallId: string,
  toolName: string,
  toolArguments: any
): Promise<string | null> {
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: '', // Tool call messages have empty content
    tool_call_id: toolCallId,
    tool_name: toolName,
    tool_arguments: toolArguments,
    metadata: { 
      source: 'ai',
      message_type: 'tool_call',
    }
  }).select('id').single();

  if (error) {
    console.error('Error persisting tool call:', error);
    return null;
  }

  console.log(`Persisted tool call: ${toolName} (${toolCallId})`);
  return data?.id || null;
}

/**
 * Persist a tool result to the database.
 * Called after tool execution completes.
 * 
 * @param supabase - Supabase client
 * @param conversationId - Conversation UUID
 * @param toolCallId - Tool call identifier this result belongs to
 * @param toolName - Name of the tool that was called
 * @param result - Result from tool execution
 * @param success - Whether the tool execution succeeded
 * @returns Message ID or null on error
 */
export async function persistToolResult(
  supabase: any,
  conversationId: string,
  toolCallId: string,
  toolName: string,
  result: any,
  success: boolean
): Promise<string | null> {
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'tool',
    content: typeof result === 'string' ? result : JSON.stringify(result),
    tool_call_id: toolCallId,
    tool_name: toolName,
    tool_result: result,
    metadata: { 
      source: 'tool',
      tool_success: success,
    }
  }).select('id').single();

  if (error) {
    console.error('Error persisting tool result:', error);
    return null;
  }

  console.log(`Persisted tool result: ${toolName} (${toolCallId}) - success: ${success}`);
  return data?.id || null;
}
