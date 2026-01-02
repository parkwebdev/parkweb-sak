/**
 * Tool Executor Module
 * 
 * Handles execution of AI tool calls including built-in and custom tools.
 * Extracted from widget-chat main handler for modularity.
 * 
 * @module _shared/handlers/tool-executor
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import type { ShownProperty } from "../types.ts";
import { findCachedToolResult, getRecentToolCalls } from "../memory/tool-cache.ts";
import { persistToolCall, persistToolResult } from "../memory/conversation-history.ts";
import { searchProperties, lookupProperty, getLocations } from "../tools/property-tools.ts";
import { checkCalendarAvailability, bookAppointment } from "../tools/calendar-tools.ts";
import { callToolEndpoint } from "../tools/custom-tools.ts";

/** Result of tool execution loop */
export interface ToolExecutionResult {
  assistantContent: string;
  toolsUsed: Array<{ name: string; success: boolean }>;
  quickReplies: string[];
  aiMarkedComplete: boolean;
  storedShownProperties?: ShownProperty[];
  lastCalendarResult: any;
  lastBookingResult: any;
}

/** Tool call from AI response */
interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

/** Enabled tool configuration */
export interface EnabledTool {
  id: string;
  name: string;
  description: string;
  parameters: any;
  endpoint_url: string | null;
  headers: any;
  timeout_ms: number | null;
}

/**
 * Executes all tool calls from the AI response.
 * Handles built-in tools (properties, calendar, quick replies) and custom tools.
 */
export async function executeToolCalls(
  supabase: ReturnType<typeof createClient>,
  options: {
    assistantMessage: any;
    assistantContent: string;
    aiRequestBody: any;
    activeConversationId: string;
    agentId: string;
    supabaseUrl: string;
    enabledTools: EnabledTool[];
    previewMode: boolean;
    conversationMetadata: any;
    openRouterApiKey: string;
  }
): Promise<ToolExecutionResult> {
  const {
    assistantMessage,
    assistantContent: initialContent,
    aiRequestBody,
    activeConversationId,
    agentId,
    supabaseUrl,
    enabledTools,
    previewMode,
    conversationMetadata,
    openRouterApiKey,
  } = options;

  let assistantContent = initialContent;
  const toolsUsed: Array<{ name: string; success: boolean }> = [];
  let quickReplies: string[] = [];
  let aiMarkedComplete = false;
  let storedShownProperties: ShownProperty[] | undefined;
  let lastCalendarResult: any = null;
  let lastBookingResult: any = null;

  // No tool calls to process
  if (!assistantMessage?.tool_calls || assistantMessage.tool_calls.length === 0) {
    return {
      assistantContent: assistantContent || '',
      toolsUsed,
      quickReplies,
      aiMarkedComplete,
      storedShownProperties,
      lastCalendarResult,
      lastBookingResult,
    };
  }

  console.log(`AI requested ${assistantMessage.tool_calls.length} tool call(s)`);

  // Fetch recent tool calls for redundancy check
  const recentToolMessages = previewMode
    ? []
    : await getRecentToolCalls(supabase, activeConversationId, 5);
  console.log(`Found ${recentToolMessages.length} recent tool calls for caching check`);

  const toolResults: Array<{ role: string; tool_call_id: string; content: string }> = [];
  let redundantCallsSkipped = 0;

  for (const toolCall of assistantMessage.tool_calls as ToolCall[]) {
    const toolName = toolCall.function.name;
    let toolArgs: any;

    try {
      toolArgs = JSON.parse(toolCall.function.arguments);
    } catch {
      toolArgs = {};
    }

    // Handle built-in quick replies tool
    if (toolName === 'suggest_quick_replies') {
      if (toolArgs.suggestions && Array.isArray(toolArgs.suggestions)) {
        quickReplies = toolArgs.suggestions.map((s: string) =>
          s.length > 40 ? s.substring(0, 37) + '...' : s
        );
        console.log(`Quick replies suggested: ${quickReplies.join(', ')}`);
      }
      continue;
    }

    // Handle mark conversation complete tool
    if (toolName === 'mark_conversation_complete') {
      console.log('AI called mark_conversation_complete:', toolArgs);
      if (toolArgs.confidence === 'high') {
        aiMarkedComplete = true;
        console.log('HIGH confidence completion signal - will trigger rating prompt');
      } else {
        console.log('MEDIUM confidence - logging only, no rating prompt');
      }
      continue;
    }

    // Handle search_properties
    if (toolName === 'search_properties') {
      const result = await executePropertySearch(
        supabase,
        agentId,
        activeConversationId,
        toolCall,
        toolArgs,
        recentToolMessages,
        previewMode
      );
      toolsUsed.push({ name: toolName, success: result.success });
      if (result.shownProperties) {
        storedShownProperties = result.shownProperties;
      }
      if (result.skipped) redundantCallsSkipped++;
      toolResults.push(result.toolResult);
      continue;
    }

    // Handle lookup_property
    if (toolName === 'lookup_property') {
      const result = await executeLookupProperty(
        supabase,
        agentId,
        activeConversationId,
        toolCall,
        toolArgs,
        recentToolMessages,
        previewMode
      );
      toolsUsed.push({ name: toolName, success: result.success });
      if (result.skipped) redundantCallsSkipped++;
      toolResults.push(result.toolResult);
      continue;
    }

    // Handle get_locations
    if (toolName === 'get_locations') {
      const result = await executeGetLocations(
        supabase,
        agentId,
        activeConversationId,
        toolCall,
        toolArgs,
        recentToolMessages,
        previewMode
      );
      toolsUsed.push({ name: toolName, success: result.success });
      if (result.skipped) redundantCallsSkipped++;
      toolResults.push(result.toolResult);
      continue;
    }

    // Handle check_calendar_availability
    if (toolName === 'check_calendar_availability') {
      const result = await executeCalendarCheck(
        supabase,
        supabaseUrl,
        activeConversationId,
        toolCall,
        toolArgs,
        recentToolMessages,
        previewMode
      );
      toolsUsed.push({ name: toolName, success: result.success });
      if (result.calendarResult) {
        lastCalendarResult = result.calendarResult;
      }
      if (result.skipped) redundantCallsSkipped++;
      toolResults.push(result.toolResult);
      continue;
    }

    // Handle book_appointment
    if (toolName === 'book_appointment') {
      const result = await executeBookAppointment(
        supabase,
        supabaseUrl,
        activeConversationId,
        conversationMetadata,
        toolCall,
        toolArgs,
        previewMode
      );
      toolsUsed.push({ name: toolName, success: result.success });
      if (result.bookingResult) {
        lastBookingResult = result.bookingResult;
      }
      toolResults.push(result.toolResult);
      continue;
    }

    // Handle custom user-defined tools
    const tool = enabledTools.find((t) => t.name === toolName);
    if (tool && tool.endpoint_url) {
      const result = await executeCustomTool(
        supabase,
        activeConversationId,
        tool,
        toolCall,
        toolArgs,
        recentToolMessages,
        previewMode
      );
      toolsUsed.push({ name: toolName, success: result.success });
      if (result.skipped) redundantCallsSkipped++;
      toolResults.push(result.toolResult);
    } else {
      console.error(`Tool ${toolName} not found or has no endpoint`);
      const errorResult = { error: `Tool ${toolName} is not configured` };

      if (!previewMode) {
        await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
        await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, errorResult, false);
      }

      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(errorResult),
      });
      toolsUsed.push({ name: toolName, success: false });
    }
  }

  if (redundantCallsSkipped > 0) {
    console.log(`Skipped ${redundantCallsSkipped} redundant tool call(s) using cached results`);
  }

  // Follow-up AI call if needed
  const needsContentFollowUp =
    !assistantContent && (quickReplies.length > 0 || aiMarkedComplete) && toolResults.length === 0;

  if (toolResults.length > 0 || needsContentFollowUp) {
    const followUpMessages = needsContentFollowUp
      ? aiRequestBody.messages
      : [...aiRequestBody.messages, assistantMessage, ...toolResults];

    console.log(
      needsContentFollowUp
        ? 'AI only provided quick replies/completion signal, making follow-up call for content'
        : 'Calling AI with tool results for final response'
    );

    const followUpResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://getpilot.io',
        'X-Title': 'Pilot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...aiRequestBody,
        messages: followUpMessages,
        tools: undefined,
        tool_choice: undefined,
      }),
    });

    if (followUpResponse.ok) {
      const followUpData = await followUpResponse.json();
      assistantContent =
        followUpData.choices?.[0]?.message?.content ||
        assistantContent ||
        'I apologize, but I was unable to generate a response.';
    } else {
      console.error('Follow-up AI call failed:', await followUpResponse.text());
      assistantContent = assistantContent || 'I apologize, but I encountered an error processing the tool results.';
    }
  }

  return {
    assistantContent: assistantContent || 'I apologize, but I was unable to generate a response.',
    toolsUsed,
    quickReplies,
    aiMarkedComplete,
    storedShownProperties,
    lastCalendarResult,
    lastBookingResult,
  };
}

// Helper functions for each tool type

async function executePropertySearch(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  conversationId: string,
  toolCall: ToolCall,
  toolArgs: any,
  recentToolMessages: any[],
  previewMode: boolean
) {
  const cachedResult = findCachedToolResult(recentToolMessages, 'search_properties', toolArgs, 10);
  if (cachedResult) {
    console.log(`Reusing cached search_properties result (${cachedResult.timestamp})`);
    const { shownProperties, ...resultForAI } = cachedResult.result || {};
    return {
      success: cachedResult.success,
      skipped: true,
      shownProperties: cachedResult.result?.shownProperties,
      toolResult: {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(resultForAI || {}),
      },
    };
  }

  if (!previewMode) {
    await persistToolCall(supabase, conversationId, toolCall.id, 'search_properties', toolArgs);
  }

  const result = await searchProperties(supabase, agentId, toolArgs);
  const { shownProperties, ...resultForAI } = result.result || {};

  if (!previewMode) {
    await persistToolResult(supabase, conversationId, toolCall.id, 'search_properties', resultForAI || { error: result.error }, result.success);
  }

  return {
    success: result.success,
    skipped: false,
    shownProperties: result.result?.shownProperties,
    toolResult: {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(resultForAI || { error: result.error }),
    },
  };
}

async function executeLookupProperty(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  conversationId: string,
  toolCall: ToolCall,
  toolArgs: any,
  recentToolMessages: any[],
  previewMode: boolean
) {
  const cachedResult = findCachedToolResult(recentToolMessages, 'lookup_property', toolArgs, 10);
  if (cachedResult) {
    console.log(`Reusing cached lookup_property result (${cachedResult.timestamp})`);
    return {
      success: cachedResult.success,
      skipped: true,
      toolResult: {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(cachedResult.result || {}),
      },
    };
  }

  if (!previewMode) {
    await persistToolCall(supabase, conversationId, toolCall.id, 'lookup_property', toolArgs);
  }

  const result = await lookupProperty(supabase, agentId, conversationId, toolArgs);
  const resultData = result.result || { error: result.error };

  if (!previewMode) {
    await persistToolResult(supabase, conversationId, toolCall.id, 'lookup_property', resultData, result.success);
  }

  return {
    success: result.success,
    skipped: false,
    toolResult: {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(resultData),
    },
  };
}

async function executeGetLocations(
  supabase: ReturnType<typeof createClient>,
  agentId: string,
  conversationId: string,
  toolCall: ToolCall,
  toolArgs: any,
  recentToolMessages: any[],
  previewMode: boolean
) {
  const cachedResult = findCachedToolResult(recentToolMessages, 'get_locations', toolArgs, 10);
  if (cachedResult) {
    console.log(`Reusing cached get_locations result (${cachedResult.timestamp})`);
    return {
      success: cachedResult.success,
      skipped: true,
      toolResult: {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(cachedResult.result || {}),
      },
    };
  }

  if (!previewMode) {
    await persistToolCall(supabase, conversationId, toolCall.id, 'get_locations', toolArgs);
  }

  const result = await getLocations(supabase, agentId);
  const resultData = result.result || { error: result.error };

  if (!previewMode) {
    await persistToolResult(supabase, conversationId, toolCall.id, 'get_locations', resultData, result.success);
  }

  return {
    success: result.success,
    skipped: false,
    toolResult: {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(resultData),
    },
  };
}

async function executeCalendarCheck(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  conversationId: string,
  toolCall: ToolCall,
  toolArgs: any,
  recentToolMessages: any[],
  previewMode: boolean
) {
  const cachedResult = findCachedToolResult(recentToolMessages, 'check_calendar_availability', toolArgs, 5);
  if (cachedResult) {
    console.log(`Reusing cached check_calendar_availability result (${cachedResult.timestamp})`);
    return {
      success: cachedResult.success,
      skipped: true,
      calendarResult: cachedResult.result,
      toolResult: {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(cachedResult.result || {}),
      },
    };
  }

  if (!previewMode) {
    await persistToolCall(supabase, conversationId, toolCall.id, 'check_calendar_availability', toolArgs);
  }

  const result = await checkCalendarAvailability(supabaseUrl, toolArgs);
  const resultData = result.result || { error: result.error };

  if (!previewMode) {
    await persistToolResult(supabase, conversationId, toolCall.id, 'check_calendar_availability', resultData, result.success);
  }

  return {
    success: result.success,
    skipped: false,
    calendarResult: result.success ? result.result : null,
    toolResult: {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(resultData),
    },
  };
}

async function executeBookAppointment(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  conversationId: string,
  conversationMetadata: any,
  toolCall: ToolCall,
  toolArgs: any,
  previewMode: boolean
) {
  // Never cache book_appointment - each booking is unique
  if (!previewMode) {
    await persistToolCall(supabase, conversationId, toolCall.id, 'book_appointment', toolArgs);
  }

  const result = await bookAppointment(supabaseUrl, conversationId, conversationMetadata, toolArgs);
  const resultData = result.result || { error: result.error };

  if (!previewMode) {
    await persistToolResult(supabase, conversationId, toolCall.id, 'book_appointment', resultData, result.success);
  }

  return {
    success: result.success,
    bookingResult: result.success ? result.result : null,
    toolResult: {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(resultData),
    },
  };
}

async function executeCustomTool(
  supabase: ReturnType<typeof createClient>,
  conversationId: string,
  tool: EnabledTool,
  toolCall: ToolCall,
  toolArgs: any,
  recentToolMessages: any[],
  previewMode: boolean
) {
  const cachedResult = findCachedToolResult(recentToolMessages, tool.name, toolArgs, 10);
  if (cachedResult) {
    console.log(`Reusing cached ${tool.name} result (${cachedResult.timestamp})`);
    return {
      success: cachedResult.success,
      skipped: true,
      toolResult: {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(cachedResult.result || {}),
      },
    };
  }

  if (!previewMode) {
    await persistToolCall(supabase, conversationId, toolCall.id, tool.name, toolArgs);
  }

  const result = await callToolEndpoint(
    {
      name: tool.name,
      endpoint_url: tool.endpoint_url!,
      headers: tool.headers || {},
      timeout_ms: tool.timeout_ms || 10000,
    },
    toolArgs
  );

  const resultData = result.success ? result.result : { error: result.error };

  if (!previewMode) {
    await persistToolResult(supabase, conversationId, toolCall.id, tool.name, resultData, result.success);
  }

  return {
    success: result.success,
    skipped: false,
    toolResult: {
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(resultData),
    },
  };
}
