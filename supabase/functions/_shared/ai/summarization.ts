/**
 * Conversation Summarization Module
 * Intelligent summarization of conversation history for context management.
 * 
 * @module _shared/ai/summarization
 * @description Uses LLM to summarize older messages instead of hard truncation.
 * 
 * @example
 * ```typescript
 * import { summarizeConversationHistory, storeConversationSummary } from "../_shared/ai/summarization.ts";
 * 
 * const result = await summarizeConversationHistory(messages, 10, apiKey, existingSummary);
 * if (result.wasNeeded) {
 *   await storeConversationSummary(supabase, conversationId, result.summary, metadata);
 * }
 * ```
 */

import { MODEL_TIERS } from './model-routing.ts';
import { SUMMARIZATION_THRESHOLD } from './config.ts';

// ============================================
// TYPES
// ============================================

export interface SummarizationResult {
  summary: string;
  keptMessages: any[];
  wasNeeded: boolean;
}

// ============================================
// CONVERSATION SUMMARIZATION
// ============================================

/**
 * Summarize older messages instead of hard truncation.
 * Uses a cheap LLM to create a context summary before truncating.
 * Only triggers when message count exceeds SUMMARIZATION_THRESHOLD.
 * 
 * @param messages - Full conversation message history
 * @param keepCount - Number of recent messages to keep
 * @param openrouterKey - OpenRouter API key
 * @param existingSummary - Previously generated summary (if any)
 * @returns Summarization result with summary, kept messages, and whether summarization was needed
 */
export async function summarizeConversationHistory(
  messages: any[],
  keepCount: number,
  openrouterKey: string,
  existingSummary?: string
): Promise<SummarizationResult> {
  // If under threshold, no summarization needed
  if (!messages || messages.length <= keepCount + 5) {
    return { 
      summary: existingSummary || '', 
      keptMessages: messages || [],
      wasNeeded: false 
    };
  }
  
  // Don't re-summarize if we already have a recent summary and messages aren't too long
  if (existingSummary && messages.length < SUMMARIZATION_THRESHOLD) {
    return {
      summary: existingSummary,
      keptMessages: messages.slice(-keepCount),
      wasNeeded: false
    };
  }
  
  const olderMessages = messages.slice(0, -keepCount);
  const recentMessages = messages.slice(-keepCount);
  
  // Format older messages for summarization (exclude tool messages for cleaner summary)
  const messagesToSummarize = olderMessages
    .filter(m => m.role !== 'tool' && !m.tool_calls)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${typeof m.content === 'string' ? m.content.substring(0, 500) : '[non-text content]'}`)
    .join('\n');
  
  // Skip if nothing meaningful to summarize
  if (!messagesToSummarize || messagesToSummarize.length < 100) {
    return {
      summary: existingSummary || '',
      keptMessages: recentMessages,
      wasNeeded: false
    };
  }
  
  console.log(`Summarizing ${olderMessages.length} older messages (keeping ${recentMessages.length})`);
  
  try {
    const summaryPrompt = `Summarize this conversation history in 3-5 concise bullet points. Focus on:
• What the user is looking for (properties, locations, features, price range)
• Properties/options shown (include addresses or lot numbers if mentioned)
• Any stated preferences (beds, baths, location, budget)
• Actions taken (bookings, inquiries, decisions made)
• Current status of their inquiry

Conversation:
${messagesToSummarize}

Return ONLY the bullet points, no introduction or conclusion.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://getpilot.io',
        'X-Title': 'Pilot Conversation Summary',
      },
      body: JSON.stringify({
        model: MODEL_TIERS.lite, // Use cheapest model for summaries
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 300,
        temperature: 0.3, // Low temperature for consistent summaries
      }),
    });

    if (!response.ok) {
      console.error(`Summarization API error: ${response.status}`);
      // Fall back to hard truncation on error
      return {
        summary: existingSummary || '',
        keptMessages: recentMessages,
        wasNeeded: false
      };
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || '';
    
    if (summary) {
      console.log(`Generated conversation summary (${summary.length} chars)`);
      return {
        summary,
        keptMessages: recentMessages,
        wasNeeded: true
      };
    }
  } catch (error) {
    console.error('Summarization error:', error);
  }
  
  // Fall back to hard truncation on any error
  return {
    summary: existingSummary || '',
    keptMessages: recentMessages,
    wasNeeded: false
  };
}

/**
 * Store conversation summary in metadata for future reference
 * 
 * @param supabase - Supabase client
 * @param conversationId - Conversation UUID
 * @param summary - Generated summary text
 * @param currentMetadata - Current conversation metadata
 */
export async function storeConversationSummary(
  supabase: any,
  conversationId: string,
  summary: string,
  currentMetadata: any
): Promise<void> {
  try {
    await supabase.from('conversations').update({
      metadata: {
        ...currentMetadata,
        conversation_summary: summary,
        summary_generated_at: new Date().toISOString(),
      }
    }).eq('id', conversationId);
    
    console.log('Stored conversation summary in metadata');
  } catch (error) {
    console.error('Error storing conversation summary:', error);
  }
}
