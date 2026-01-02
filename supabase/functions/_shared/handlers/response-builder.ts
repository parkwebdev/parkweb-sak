/**
 * Response Builder Module
 * 
 * Handles post-generation processing, message persistence, and response construction.
 * Extracted from widget-chat main handler for modularity.
 * 
 * @module _shared/handlers/response-builder
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { corsHeaders } from "../cors.ts";
import type { ConversationMetadata, ShownProperty } from "../types.ts";
import { moderateContent } from "../security/moderation.ts";
import { sanitizeAiOutput } from "../security/sanitization.ts";
import { splitResponseIntoChunks } from "../utils/response-chunking.ts";
import { fetchLinkPreviews } from "../utils/links.ts";
import { extractPhoneNumbers } from "../utils/phone.ts";
import { cacheResponse } from "../ai/rag.ts";
import { extractAndStoreMemories } from "../memory/semantic-memory.ts";
import { detectConversationLanguage } from "../utils/language.ts";
import {
  transformToDayPickerData,
  transformToTimePickerData,
  transformToBookingConfirmedData,
  detectSelectedDateFromMessages,
  type DayPickerData,
  type TimePickerData,
  type BookingConfirmationData,
} from "../tools/booking-ui.ts";

/** Options for post-processing AI response */
export interface PostProcessOptions {
  assistantContent: string;
  conversationId: string;
  requestId: string;
  agentId: string;
  previewMode: boolean;
  supabase: ReturnType<typeof createClient>;
}

/** Result of post-processing */
export interface PostProcessResult {
  sanitizedContent: string;
  isBlocked: boolean;
}

/**
 * Performs post-generation content moderation and sanitization.
 */
export async function postProcessResponse(
  options: PostProcessOptions
): Promise<PostProcessResult> {
  const { assistantContent, conversationId, requestId, agentId, previewMode, supabase } = options;

  // Content moderation
  const moderation = await moderateContent(assistantContent);

  if (moderation.action === 'block') {
    console.warn(`[${requestId}] AI output blocked: Flagged for ${moderation.categories.join(', ')}`);

    // Log security event
    supabase
      .from('security_logs')
      .insert({
        action: 'ai_output_blocked',
        resource_type: 'conversation',
        resource_id: conversationId,
        success: true,
        details: {
          type: 'ai_response',
          categories: moderation.categories,
          severity: moderation.severity,
          request_id: requestId,
          agent_id: agentId,
        },
      })
      .then(() => console.log(`[${requestId}] Security event logged: ai_output_blocked`))
      .catch((err) => console.error(`[${requestId}] Failed to log security event:`, err));

    return {
      sanitizedContent: "I apologize, but I wasn't able to generate an appropriate response. How else can I help you?",
      isBlocked: true,
    };
  }

  if (moderation.action === 'warn') {
    console.warn(`[${requestId}] AI output warning: Flagged for ${moderation.categories.join(', ')}`);
    supabase
      .from('security_logs')
      .insert({
        action: 'ai_output_warning',
        resource_type: 'conversation',
        resource_id: conversationId,
        success: true,
        details: {
          type: 'ai_response',
          categories: moderation.categories,
          severity: moderation.severity,
          request_id: requestId,
          agent_id: agentId,
        },
      })
      .catch((err) => console.error(`[${requestId}] Failed to log output warning:`, err));
  }

  // Sanitize output
  const { sanitized, redactionsApplied } = sanitizeAiOutput(assistantContent);

  if (redactionsApplied > 0) {
    console.warn(`[${requestId}] Security: Redacted ${redactionsApplied} sensitive pattern(s) from AI response`);
    supabase
      .from('security_logs')
      .insert({
        action: 'ai_output_sanitized',
        resource_type: 'conversation',
        resource_id: conversationId,
        success: true,
        details: {
          redactions_count: redactionsApplied,
          request_id: requestId,
          agent_id: agentId,
        },
      })
      .then(() => console.log(`[${requestId}] Security event logged: ai_output_sanitized`))
      .catch((err) => console.error(`[${requestId}] Failed to log security event:`, err));
  }

  return { sanitizedContent: sanitized, isBlocked: false };
}

/**
 * Adds natural typing delay for realistic response timing.
 */
export async function addTypingDelay(): Promise<number> {
  const minDelay = 2000;
  const maxDelay = 3000;
  const typingDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  console.log(`Adding natural typing delay: ${typingDelay}ms`);
  await new Promise((resolve) => setTimeout(resolve, typingDelay));
  return typingDelay;
}

/**
 * Caches response if similarity threshold is met.
 */
export function cacheResponseIfEligible(
  supabase: ReturnType<typeof createClient>,
  queryHash: string | null,
  agentId: string,
  content: string,
  maxSimilarity: number
): void {
  if (queryHash && maxSimilarity > 0.65) {
    console.log(`Caching response with similarity ${maxSimilarity.toFixed(2)} for future reuse`);
    cacheResponse(supabase, queryHash, agentId, content, maxSimilarity);
  }
}

/** Options for saving response chunks */
export interface SaveChunksOptions {
  supabase: ReturnType<typeof createClient>;
  conversationId: string;
  content: string;
  selectedModel: string;
  modelTier: string;
  sources: any[];
  toolsUsed: any[];
  supabaseUrl: string;
  supabaseKey: string;
  previewMode: boolean;
}

/** Result from saving chunks */
export interface SaveChunksResult {
  chunks: string[];
  assistantMessageIds: string[];
  linkPreviews: any[];
}

/**
 * Splits response into chunks and saves to database.
 */
export async function saveResponseChunks(options: SaveChunksOptions): Promise<SaveChunksResult> {
  const {
    supabase,
    conversationId,
    content,
    selectedModel,
    modelTier,
    sources,
    toolsUsed,
    supabaseUrl,
    supabaseKey,
    previewMode,
  } = options;

  const chunks = splitResponseIntoChunks(content);
  console.log(`Splitting response into ${chunks.length} chunks`);

  const linkPreviews = await fetchLinkPreviews(content, supabaseUrl, supabaseKey);
  console.log(`Cached ${linkPreviews.length} link previews for assistant message`);

  const assistantMessageIds: string[] = [];

  if (!previewMode) {
    for (let i = 0; i < chunks.length; i++) {
      const chunkTimestamp = new Date(Date.now() + i * 100);
      const isLastChunk = i === chunks.length - 1;

      const { data: msg, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: chunks[i],
          created_at: chunkTimestamp.toISOString(),
          metadata: {
            source: 'ai',
            model: selectedModel,
            model_tier: modelTier,
            chunk_index: i,
            chunk_total: chunks.length,
            knowledge_sources: isLastChunk && sources.length > 0 ? sources : undefined,
            tools_used: isLastChunk && toolsUsed.length > 0 ? toolsUsed : undefined,
            link_previews: isLastChunk && linkPreviews.length > 0 ? linkPreviews : undefined,
          },
        })
        .select('id')
        .single();

      if (msgError) {
        console.error(`Error saving chunk ${i}:`, msgError);
      }
      if (msg) assistantMessageIds.push(msg.id);
    }
  }

  return { chunks, assistantMessageIds, linkPreviews };
}

/** Options for updating conversation metadata */
export interface UpdateMetadataOptions {
  supabase: ReturnType<typeof createClient>;
  conversationId: string;
  conversationMetadata: any;
  assistantContent: string;
  pageVisits: any[];
  storedShownProperties?: ShownProperty[];
  messagesToSend: any[];
  openRouterApiKey: string;
  previewMode: boolean;
}

/**
 * Updates conversation metadata after response.
 */
export async function updateConversationMetadata(options: UpdateMetadataOptions): Promise<void> {
  const {
    supabase,
    conversationId,
    conversationMetadata,
    assistantContent,
    pageVisits,
    storedShownProperties,
    messagesToSend,
    openRouterApiKey,
    previewMode,
  } = options;

  if (previewMode) return;

  const currentMetadata = conversationMetadata || {};

  // Merge page visits
  let mergedPageVisits = currentMetadata.visited_pages || [];
  if (pageVisits && Array.isArray(pageVisits)) {
    const existingUrls = new Set(mergedPageVisits.map((v: any) => `${v.url}-${v.entered_at}`));
    const newVisits = pageVisits.filter((v: any) => !existingUrls.has(`${v.url}-${v.entered_at}`));
    mergedPageVisits = [...mergedPageVisits, ...newVisits];
    console.log(`Merged ${newVisits.length} new page visits, total: ${mergedPageVisits.length}`);
  }

  // Language detection
  let detectedLanguage: { code: string; name: string } | null = null;
  const existingLangCode = (currentMetadata as ConversationMetadata)?.detected_language_code;

  if (!existingLangCode) {
    const userMsgsForDetection = (messagesToSend || [])
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content || '')
      .slice(-3);

    if (userMsgsForDetection.length > 0) {
      detectedLanguage = await detectConversationLanguage(userMsgsForDetection, openRouterApiKey);
    }
  }

  await supabase
    .from('conversations')
    .update({
      metadata: {
        ...currentMetadata,
        messages_count: (currentMetadata.messages_count || 0) + 2,
        first_message_at: currentMetadata.first_message_at || new Date().toISOString(),
        visited_pages: mergedPageVisits,
        last_message_preview: assistantContent.substring(0, 60),
        last_message_role: 'assistant',
        last_message_at: new Date().toISOString(),
        last_user_message_at: new Date().toISOString(),
        shown_properties: storedShownProperties?.length
          ? storedShownProperties
          : currentMetadata.shown_properties,
        ...(storedShownProperties?.length && {
          last_property_search_at: new Date().toISOString(),
        }),
        ...(detectedLanguage && {
          detected_language_code: detectedLanguage.code,
          detected_language: detectedLanguage.name,
        }),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
}

/** Options for tracking usage */
export interface TrackUsageOptions {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  currentApiCalls: number;
  currentMessagesCount: number;
  previewMode: boolean;
}

/**
 * Tracks API call and message usage.
 */
export function trackUsage(options: TrackUsageOptions): void {
  const { supabase, userId, currentApiCalls, currentMessagesCount, previewMode } = options;

  if (previewMode) return;

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  supabase
    .from('usage_metrics')
    .upsert(
      {
        user_id: userId,
        period_start: firstDayOfMonth.toISOString(),
        period_end: lastDayOfMonth.toISOString(),
        api_calls_count: currentApiCalls + 1,
        messages_count: currentMessagesCount + 2,
      },
      { onConflict: 'user_id,period_start' }
    )
    .then(() => console.log('API and message usage tracked'))
    .catch((err) => console.error('Failed to track usage:', err));
}

/** Options for extracting memories */
export interface ExtractMemoriesOptions {
  supabase: ReturnType<typeof createClient>;
  agentId: string;
  conversationId: string;
  messages: any[];
  assistantContent: string;
  conversationMetadata: any;
  openRouterApiKey: string;
  isGreetingRequest: boolean;
  previewMode: boolean;
}

/**
 * Extracts and stores semantic memories from conversation.
 */
export function extractMemories(options: ExtractMemoriesOptions): void {
  const {
    supabase,
    agentId,
    conversationId,
    messages,
    assistantContent,
    conversationMetadata,
    openRouterApiKey,
    isGreetingRequest,
    previewMode,
  } = options;

  if (previewMode || isGreetingRequest || !messages || messages.length === 0) return;

  const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop();
  if (!lastUserMsg?.content || !assistantContent) return;

  const leadId = conversationMetadata?.lead_id as string | undefined;

  extractAndStoreMemories(
    supabase,
    agentId,
    leadId || null,
    conversationId,
    lastUserMsg.content,
    assistantContent,
    openRouterApiKey
  ).catch((err) => console.error('Memory extraction error:', err));
}

/** Options for building final response */
export interface BuildResponseOptions {
  conversationId: string;
  requestId: string;
  chunks: string[];
  assistantMessageIds: string[];
  assistantContent: string;
  userMessageId: string | undefined;
  sources: any[];
  toolsUsed: any[];
  linkPreviews: any[];
  quickReplies: string[];
  aiMarkedComplete: boolean;
  lastCalendarResult: any;
  lastBookingResult: any;
  messagesToSend: any[];
  totalDuration: number;
  previewMode: boolean;
  log: any;
}

/**
 * Builds the final API response.
 */
export function buildFinalResponse(options: BuildResponseOptions): Response {
  const {
    conversationId,
    requestId,
    chunks,
    assistantMessageIds,
    assistantContent,
    userMessageId,
    sources,
    toolsUsed,
    linkPreviews,
    quickReplies,
    aiMarkedComplete,
    lastCalendarResult,
    lastBookingResult,
    messagesToSend,
    totalDuration,
    previewMode,
    log,
  } = options;

  // Build booking UI components
  let dayPicker: DayPickerData | undefined;
  let timePicker: TimePickerData | undefined;
  let bookingConfirmed: BookingConfirmationData | undefined;

  if (lastCalendarResult?.available_slots?.length > 0) {
    const userSelectedDate = detectSelectedDateFromMessages(messagesToSend);

    if (userSelectedDate) {
      timePicker = transformToTimePickerData(lastCalendarResult, userSelectedDate) || undefined;
      if (!timePicker) {
        dayPicker = transformToDayPickerData(lastCalendarResult) || undefined;
      }
    } else {
      dayPicker = transformToDayPickerData(lastCalendarResult) || undefined;
    }
  }

  if (lastBookingResult?.booking) {
    bookingConfirmed = transformToBookingConfirmedData(lastBookingResult) || undefined;
  }

  const assistantMessageId = assistantMessageIds[assistantMessageIds.length - 1];

  log.info('Request completed', {
    conversationId,
    durationMs: Math.round(totalDuration),
    chunksCount: chunks.length,
    hasToolsUsed: toolsUsed.length > 0,
    hasLinkPreviews: linkPreviews.length > 0,
  });

  return new Response(
    JSON.stringify({
      conversationId: previewMode ? null : conversationId,
      requestId,
      messages: chunks.map((content, i) => ({
        id: previewMode ? `preview-${i}` : assistantMessageIds[i],
        content,
        chunkIndex: i,
      })),
      response: assistantContent,
      userMessageId: previewMode ? undefined : userMessageId,
      assistantMessageId: previewMode ? undefined : assistantMessageId,
      sources: sources.length > 0 ? sources : undefined,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      linkPreviews: linkPreviews.length > 0 ? linkPreviews : undefined,
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
      callActions: (() => {
        const callActionsResult = extractPhoneNumbers(assistantContent);
        if (callActionsResult.length > 0) {
          log.debug('Phone numbers detected', {
            count: callActionsResult.length,
            numbers: callActionsResult.map((a) => a.displayNumber),
          });
        }
        return callActionsResult.length > 0 ? callActionsResult : undefined;
      })(),
      dayPicker,
      timePicker,
      bookingConfirmed,
      aiMarkedComplete,
      durationMs: Math.round(totalDuration),
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
