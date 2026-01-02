import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ============================================
// SHARED MODULES (Phase 1 + Phase 2 + Phase 3 + Phase 4 Extraction)
// ============================================

// Phase 1: Core infrastructure
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { 
  ErrorCodes, 
  type ErrorCode, 
  MAX_MESSAGE_LENGTH, 
  MAX_FILES_PER_MESSAGE, 
  createErrorResponse 
} from "../_shared/errors.ts";
import { 
  type ShownProperty, 
  type ConversationMetadata, 
  type CallAction, 
  URL_REGEX, 
  PHONE_REGEX 
} from "../_shared/types.ts";

// Phase 2: Utility functions
import { extractPhoneNumbers } from "../_shared/utils/phone.ts";
import { hashApiKey } from "../_shared/utils/hashing.ts";
import { fetchLinkPreviews } from "../_shared/utils/links.ts";
import { detectConversationLanguage, LANGUAGE_NAMES } from "../_shared/utils/language.ts";

// Phase 3: Additional utilities
import { getLocationFromIP } from "../_shared/utils/geo.ts";
import { parseUserAgent, isWidgetRequest } from "../_shared/utils/user-agent.ts";
import { splitResponseIntoChunks } from "../_shared/utils/response-chunking.ts";

// Phase 2 + 3: AI configuration
import { 
  EMBEDDING_MODEL, 
  EMBEDDING_DIMENSIONS, 
  MAX_CONVERSATION_HISTORY, 
  MAX_RAG_CHUNKS, 
  SUMMARIZATION_THRESHOLD,
  RESPONSE_FORMATTING_RULES 
} from "../_shared/ai/config.ts";
import { MODEL_TIERS } from "../_shared/ai/model-routing.ts";
import { getModelCapabilities, MODEL_CAPABILITIES, type ModelCapabilities } from "../_shared/ai/model-capabilities.ts";
import { generateEmbedding, getCachedEmbedding, cacheQueryEmbedding } from "../_shared/ai/embeddings.ts";
import { searchKnowledge, getCachedResponse, cacheResponse, type KnowledgeResult } from "../_shared/ai/rag.ts";
import { summarizeConversationHistory, storeConversationSummary, type SummarizationResult } from "../_shared/ai/summarization.ts";

// Phase 2: Security
import { SECURITY_GUARDRAILS } from "../_shared/security/guardrails.ts";
import { sanitizeAiOutput, BLOCKED_PATTERNS } from "../_shared/security/sanitization.ts";
import { 
  moderateContent, 
  type ModerationResult,
  HIGH_SEVERITY_CATEGORIES,
  MEDIUM_SEVERITY_CATEGORIES 
} from "../_shared/security/moderation.ts";

// Phase 3: Tools
import { 
  transformToDayPickerData, 
  transformToTimePickerData, 
  transformToBookingConfirmedData,
  detectSelectedDateFromMessages,
  type DayPickerData,
  type TimePickerData,
  type BookingConfirmationData,
  type BookingDay,
  type BookingTime
} from "../_shared/tools/booking-ui.ts";
import { BOOKING_TOOLS } from "../_shared/tools/definitions.ts";
import { 
  searchProperties, 
  lookupProperty, 
  getLocations,
  type ToolResult
} from "../_shared/tools/property-tools.ts";
import { checkCalendarAvailability, bookAppointment } from "../_shared/tools/calendar-tools.ts";
import { callToolEndpoint, isBlockedUrl, MAX_RESPONSE_SIZE_BYTES, MAX_RETRIES, INITIAL_RETRY_DELAY_MS } from "../_shared/tools/custom-tools.ts";

// Phase 3: Memory
import { 
  fetchConversationHistory, 
  convertDbMessagesToOpenAI,
  persistToolCall, 
  persistToolResult,
  type DbMessage 
} from "../_shared/memory/conversation-history.ts";
import { findCachedToolResult, getRecentToolCalls, normalizeToolArgs, type CachedToolResult } from "../_shared/memory/tool-cache.ts";
import { 
  searchSemanticMemories, 
  extractAndStoreMemories, 
  formatMemoriesForPrompt,
  type SemanticMemory 
} from "../_shared/memory/semantic-memory.ts";

// Hashing utilities (need normalizeQuery for cache)
import { normalizeQuery, hashQuery } from "../_shared/utils/hashing.ts";

// ============================================
// PHASE 4: Handler Modules 
// High-level orchestration functions extracted for modularity
// ============================================
import {
  getOrCreateConversation,
  checkConversationStatus,
  saveUserMessage,
} from "../_shared/handlers/conversation.ts";
import { buildContext } from "../_shared/handlers/context.ts";
import {
  postProcessResponse,
  addTypingDelay,
  cacheResponseIfEligible,
  saveResponseChunks,
  updateConversationMetadata,
  trackUsage,
  extractMemories,
  buildFinalResponse,
} from "../_shared/handlers/response-builder.ts";
import { executeToolCalls, type EnabledTool } from "../_shared/handlers/tool-executor.ts";

// ============================================
// Local function selectModelTier kept for backward compatibility
// ============================================
function selectModelTier(
  query: string,
  ragSimilarity: number,
  conversationLength: number,
  requiresTools: boolean,
  agentModel: string
): { model: string; tier: 'lite' | 'standard' | 'premium' } {
  const wordCount = query.split(/\s+/).length;
  
  // Tier 1: Cheapest - simple lookups with high RAG match, no tools
  if (ragSimilarity > 0.60 && wordCount < 15 && !requiresTools && conversationLength < 5) {
    return { model: MODEL_TIERS.lite, tier: 'lite' };
  }
  
  // Tier 3: Premium - complex reasoning needed
  if (ragSimilarity < 0.35 || conversationLength > 10 || requiresTools) {
    return { model: agentModel || MODEL_TIERS.standard, tier: 'premium' };
  }
  
  // Tier 2: Default balanced
  return { model: MODEL_TIERS.standard, tier: 'standard' };
}

serve(async (req) => {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  const log = createLogger(requestId);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, conversationId, messages, leadId, pageVisits, referrerJourney, visitorId, previewMode, browserLanguage } = await req.json();

    // Log incoming request
    log.info('Request received', {
      agentId,
      conversationId: conversationId || 'new',
      messagesCount: messages?.length || 0,
      pageVisitsCount: pageVisits?.length || 0,
      hasReferrerJourney: !!referrerJourney,
      visitorId: visitorId || null,
      previewMode: !!previewMode,
      browserLanguage: browserLanguage || null,
    });

    // Validate required fields
    if (!agentId) {
      return createErrorResponse(
        requestId,
        ErrorCodes.INVALID_REQUEST,
        'Agent ID is required',
        400,
        performance.now() - startTime
      );
    }

    // Validate message size limits
    const userMessage = messages?.[0];
    if (userMessage?.content && userMessage.content.length > MAX_MESSAGE_LENGTH) {
      log.warn('Message too long', { 
        length: userMessage.content.length, 
        maxLength: MAX_MESSAGE_LENGTH 
      });
      return createErrorResponse(
        requestId,
        ErrorCodes.MESSAGE_TOO_LONG,
        `Message too long. Maximum ${MAX_MESSAGE_LENGTH.toLocaleString()} characters allowed.`,
        400,
        performance.now() - startTime
      );
    }

    // Validate file count
    if (userMessage?.files && userMessage.files.length > MAX_FILES_PER_MESSAGE) {
      log.warn('Too many files', { 
        count: userMessage.files.length, 
        maxFiles: MAX_FILES_PER_MESSAGE 
      });
      return createErrorResponse(
        requestId,
        ErrorCodes.TOO_MANY_FILES,
        `Too many files. Maximum ${MAX_FILES_PER_MESSAGE} files allowed.`,
        400,
        performance.now() - startTime
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check authentication - widget requests bypass API key validation
    const authHeader = req.headers.get('authorization');
    const isFromWidget = isWidgetRequest(req);
    
    // Widget requests are allowed through without API key validation
    if (isFromWidget) {
      log.debug('Widget origin detected - bypassing API key validation');
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Non-widget requests with API key - validate it
      const apiKey = authHeader.substring(7);
      
      // Hash the API key for comparison
      const keyHash = await hashApiKey(apiKey);
      
      // Validate API key and check rate limits
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_api_key', { p_key_hash: keyHash, p_agent_id: agentId });
      
      if (validationError) {
        log.error('API key validation error', { error: validationError.message });
        return createErrorResponse(
          requestId,
          ErrorCodes.INTERNAL_ERROR,
          'API key validation failed',
          500,
          performance.now() - startTime
        );
      }
      
      const validation = validationResult?.[0];
      
      if (!validation?.valid) {
        log.warn('Invalid API key attempt', { agentId });
        return createErrorResponse(
          requestId,
          ErrorCodes.UNAUTHORIZED,
          validation?.error_message || 'Invalid API key',
          401,
          performance.now() - startTime
        );
      }
      
      if (validation.rate_limited) {
        log.warn('Rate limited API key', { keyId: validation.key_id });
        return createErrorResponse(
          requestId,
          ErrorCodes.RATE_LIMITED,
          validation.error_message || 'Rate limit exceeded',
          429,
          performance.now() - startTime
        );
      }
      
      log.info('API key authenticated', { keyId: validation.key_id });
    } else {
      // No API key and not from widget - reject
      log.warn('Rejected - no API key and not from widget origin');
      return createErrorResponse(
        requestId,
        ErrorCodes.UNAUTHORIZED,
        'API key required. Include Authorization: Bearer <api_key> header.',
        401,
        performance.now() - startTime
      );
    }

    // Get agent configuration and user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('system_prompt, model, user_id, temperature, max_tokens, deployment_config')
      .eq('id', agentId)
      .single();

    if (agentError) throw agentError;

    const deploymentConfig = (agent.deployment_config || {}) as { embedded_chat?: Record<string, unknown> };

    // Fetch enabled custom tools for this agent
    const { data: agentTools, error: toolsError } = await supabase
      .from('agent_tools')
      .select('id, name, description, parameters, endpoint_url, headers, timeout_ms')
      .eq('agent_id', agentId)
      .eq('enabled', true);

    if (toolsError) {
      console.error('Error fetching tools:', toolsError);
    }

    // Filter to only tools with valid endpoint URLs
    const enabledTools: EnabledTool[] = (agentTools || []).filter(tool => tool.endpoint_url).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      endpoint_url: t.endpoint_url,
      headers: t.headers,
      timeout_ms: t.timeout_ms,
    }));
    console.log(`Found ${enabledTools.length} enabled tools with endpoints for agent ${agentId}`);

    // Check if agent has locations (enables booking tools)
    const { data: agentLocations } = await supabase
      .from('locations')
      .select('id')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .limit(1);
    
    const hasLocations = agentLocations && agentLocations.length > 0;
    console.log(`Agent has locations: ${hasLocations}`);

    // Format tools for OpenAI/Lovable AI API
    // Include booking tools if agent has locations configured
    const userDefinedTools = enabledTools.length > 0 ? enabledTools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters || { type: 'object', properties: {} },
      }
    })) : [];
    
    const formattedTools = hasLocations 
      ? [...userDefinedTools, ...BOOKING_TOOLS]
      : userDefinedTools.length > 0 ? userDefinedTools : undefined;

    // Capture request metadata
    const ipAddress = req.headers.get('cf-connecting-ip') || 
                      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent');
    const referer = req.headers.get('referer') || null;
    const { device, browser, os } = parseUserAgent(userAgent);
    
    // Get location from IP address via geo-IP lookup
    const { country, city, countryCode, region } = await getLocationFromIP(ipAddress);

    // ============================================
    // PHASE 4: Use getOrCreateConversation handler
    // ============================================
    const { conversationId: activeConversationId, isNew: isNewConversation } = await getOrCreateConversation(
      supabase,
      {
        conversationId,
        agentId,
        agentUserId: agent.user_id,
        previewMode: !!previewMode,
        ipAddress,
        country,
        city,
        countryCode,
        region,
        device,
        browser,
        os,
        referer,
        leadId,
        visitorId,
        referrerJourney,
      }
    );

    // ============================================
    // PHASE 4: Use checkConversationStatus handler
    // ============================================
    const statusResult = await checkConversationStatus(
      supabase,
      activeConversationId,
      messages,
      !!previewMode
    );
    
    if (statusResult.shouldReturn) {
      return statusResult.response!;
    }
    
    const conversation = statusResult.conversation;

    // Check if this is a greeting request (special message to trigger AI greeting)
    const isGreetingRequest = messages && messages.length === 1 && 
      messages[0].role === 'user' && 
      messages[0].content === '__GREETING_REQUEST__';

    // ============================================
    // PHASE 4: Use saveUserMessage handler
    // ============================================
    const { userMessageId, isBlocked: userMessageBlocked, blockResponse } = await saveUserMessage(
      supabase,
      {
        conversationId: activeConversationId,
        message: messages?.[messages.length - 1],
        isGreetingRequest,
        previewMode: !!previewMode,
        requestId,
        agentId,
        conversationMetadata: conversation?.metadata,
      }
    );

    // Early return if user message was blocked by content moderation
    if (userMessageBlocked) {
      return blockResponse!;
    }

    // ============================================
    // DATABASE-FIRST MESSAGE FETCHING
    // Fetch conversation history from database (source of truth)
    // ============================================
    let dbConversationHistory: any[] = [];
    if (activeConversationId && !isGreetingRequest && !previewMode) {
      dbConversationHistory = await fetchConversationHistory(supabase, activeConversationId);
      console.log(`Fetched ${dbConversationHistory.length} messages from database (including ${dbConversationHistory.filter((m: any) => m.role === 'tool').length} tool results)`);
    }
    
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, plans(limits)')
      .eq('user_id', agent.user_id)
      .eq('status', 'active')
      .maybeSingle();

    // Default free plan limit
    let maxApiCalls = 1000;
    
    if (subscription?.plans) {
      const plan = subscription.plans as { limits?: { max_api_calls_per_month?: number } };
      const limits = plan.limits;
      maxApiCalls = limits?.max_api_calls_per_month || 1000;
    }

    // Get current month's API usage
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: usageMetrics } = await supabase
      .from('usage_metrics')
      .select('api_calls_count, messages_count')
      .eq('user_id', agent.user_id)
      .gte('period_start', firstDayOfMonth.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentApiCalls = usageMetrics?.api_calls_count || 0;
    const currentMessagesCount = usageMetrics?.messages_count || 0;

    // Hard limit enforcement
    if (currentApiCalls >= maxApiCalls) {
      return new Response(
        JSON.stringify({ 
          error: 'API call limit exceeded for this month. Please upgrade your plan or wait until next month.',
          limit_reached: true,
          current: currentApiCalls,
          limit: maxApiCalls,
          conversationId: activeConversationId,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Soft limit warning (80% threshold)
    const usagePercentage = (currentApiCalls / maxApiCalls) * 100;
    console.log(`API usage: ${currentApiCalls}/${maxApiCalls} (${usagePercentage.toFixed(1)}%)`);

    // Get OpenRouter API key
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    // ============================================
    // PHASE 4: Use buildContext handler for RAG
    // ============================================
    const conversationMetadata = (conversation?.metadata || {}) as ConversationMetadata;
    
    const contextResult = await buildContext(supabase, {
      agentId,
      baseSystemPrompt: agent.system_prompt || 'You are a helpful AI assistant.',
      messages,
      isGreetingRequest,
      previewMode: !!previewMode,
      conversationMetadata,
      activeConversationId,
      hasLocations,
    });

    // Check if we got a cached response (early return)
    if (contextResult.cachedResponse) {
      return contextResult.cachedResponse;
    }

    let systemPrompt = contextResult.systemPrompt;
    const sources = contextResult.sources;
    const queryHash = contextResult.queryHash;
    const maxSimilarity = contextResult.maxSimilarity;
    const retrievedMemories = contextResult.retrievedMemories;
    const queryEmbeddingForMemory = contextResult.queryEmbeddingForMemory;

    // ============================================
    // MESSAGE HISTORY PROCESSING
    // ============================================
    // Merge client-provided messages with database history for preview mode
    let rawHistory: any[];
    if (previewMode) {
      // Preview mode: use client-provided messages (no database history)
      rawHistory = messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
    } else if (dbConversationHistory.length > 0) {
      // Normal mode: convert database messages to OpenAI format
      rawHistory = convertDbMessagesToOpenAI(dbConversationHistory);
    } else {
      // Fallback: use client messages if no database history
      rawHistory = messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      }));
    }
    
    // Get existing summary from conversation metadata if available
    const existingSummary = conversationMetadata?.conversation_summary as string | undefined;
    
    // Summarize if conversation is long (preserves context that would otherwise be lost)
    const { summary: conversationSummary, keptMessages, wasNeeded: summaryGenerated } = 
      await summarizeConversationHistory(
        rawHistory,
        MAX_CONVERSATION_HISTORY,
        OPENROUTER_API_KEY,
        existingSummary
      );
    
    let messagesToSend = keptMessages;
    
    // Store summary in conversation metadata for future use
    if (summaryGenerated && conversationSummary && activeConversationId) {
      await storeConversationSummary(
        supabase,
        activeConversationId,
        conversationSummary,
        conversationMetadata
      );
    }
    
    // Inject conversation summary into system prompt for context continuity
    if (conversationSummary) {
      systemPrompt = systemPrompt + `

EARLIER CONVERSATION SUMMARY:
The following summarizes earlier parts of this conversation that are no longer in the immediate message history:
${conversationSummary}

Use this context to maintain continuity - the user may reference things from earlier in the conversation.`;
      console.log(`Injected conversation summary (${conversationSummary.length} chars) into system prompt`);
    }

    // Handle greeting requests
    let initialUserMessage: string | null = null;
    const messageFieldPatterns = /message|question|help|inquiry|reason|about|need|looking for|interest|details|describe|explain|issue|problem|request|comment/i;
    
    if (conversationMetadata.custom_fields) {
      for (const [label, value] of Object.entries(conversationMetadata.custom_fields)) {
        if (value && typeof value === 'string' && value.trim()) {
          const isMessageField = messageFieldPatterns.test(label) && value.length > 20;
          if (isMessageField && !initialUserMessage) {
            initialUserMessage = value as string;
            console.log(`Detected initial user message from field "${label}": "${value.substring(0, 50)}..."`);
            break;
          }
        }
      }
    }
    
    // For greeting requests, add a special instruction and use empty messages
    if (isGreetingRequest) {
      console.log('Handling greeting request - generating personalized welcome', { hasInitialMessage: !!initialUserMessage });
      
      if (initialUserMessage) {
        // User already told us what they need - respond directly to their inquiry
        systemPrompt = systemPrompt + `

GREETING REQUEST WITH INITIAL INQUIRY:
The user has already told you what they need in the contact form: "${initialUserMessage}"

Your response should:
- Greet them briefly by name if available (one short greeting)
- IMMEDIATELY address their inquiry - provide a helpful, substantive response
- Do NOT ask "how can I help?" or "what can I assist you with?" - they already told you
- Be direct and efficient - they're waiting for real help, not pleasantries
- If you need clarification, ask a specific follow-up question about their inquiry`;
        
        // Replace with a message that prompts the AI to respond to their inquiry
        messagesToSend = [{ role: 'user', content: initialUserMessage }];
      } else {
        // No initial message - use standard greeting
        systemPrompt = systemPrompt + `

GREETING REQUEST:
This is the start of a new conversation. The user has just filled out a contact form and is ready to chat.
Generate a warm, personalized greeting using the user information provided above (if available).
- If you know their name, address them personally
- If you know their company or interests from custom fields, briefly acknowledge it
- Keep it concise (1-2 sentences) and end with an invitation to ask questions
- Be natural and friendly, not overly formal
- Do NOT start with "Hello!" or "Hi there!" - be more creative and personal`;
        
        // Replace the greeting request with a user message asking for a greeting
        messagesToSend = [{ role: 'user', content: 'Please greet me and ask how you can help.' }];
      }
    }

    // SMART MODEL ROUTING: Select optimal model based on query complexity
    const hasUserTools = formattedTools && formattedTools.length > 0;
    const conversationLength = messagesToSend.length;
    const lastUserQuery = messagesToSend.filter((m: any) => m.role === 'user').pop()?.content || '';
    
    const { model: selectedModel, tier: modelTier } = selectModelTier(
      lastUserQuery,
      maxSimilarity,
      conversationLength,
      hasUserTools,
      agent.model || 'google/gemini-2.5-flash'
    );
    
    console.log(`Model routing: tier=${modelTier}, model=${selectedModel}, ragSimilarity=${maxSimilarity.toFixed(2)}, hasTools=${hasUserTools}`);

    // Build the initial AI request with only SUPPORTED behavior settings
    const modelCaps = getModelCapabilities(selectedModel);
    const aiRequestBody: any = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messagesToSend,
      ],
      stream: false,
      temperature: agent.temperature || 0.7,
      max_completion_tokens: agent.max_tokens || 2000,
    };

    // Only add parameters the model supports
    if (modelCaps.topP.supported) {
      aiRequestBody.top_p = (deploymentConfig as any).top_p || 1.0;
    }
    if (modelCaps.presencePenalty.supported) {
      aiRequestBody.presence_penalty = (deploymentConfig as any).presence_penalty || 0;
    }
    if (modelCaps.frequencyPenalty.supported) {
      aiRequestBody.frequency_penalty = (deploymentConfig as any).frequency_penalty || 0;
    }
    if (modelCaps.topK.supported && (deploymentConfig as any).top_k) {
      aiRequestBody.top_k = (deploymentConfig as any).top_k;
    }
    
    console.log(`Model capabilities applied: topP=${modelCaps.topP.supported}, penalties=${modelCaps.presencePenalty.supported}, topK=${modelCaps.topK.supported}`);

    // PHASE 7: Skip quick replies for lite model tier (reduces tool call overhead)
    // Also check agent config for enable_quick_replies setting (defaults to true)
    const enableQuickReplies = (deploymentConfig as any).enable_quick_replies !== false;
    const shouldIncludeQuickReplies = enableQuickReplies && modelTier !== 'lite';
    
    // Built-in quick replies tool (conditional based on tier and config)
    const quickRepliesTool = shouldIncludeQuickReplies ? {
      type: 'function',
      function: {
        name: 'suggest_quick_replies',
        description: 'IMPORTANT: Always provide your full response text first, then call this tool to suggest follow-up options. Suggest 2-4 relevant follow-up questions or actions based on your response. Never call this tool without also providing response content in the same message.',
        parameters: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              description: 'Array of 2-4 short, actionable suggestions (max 40 characters each)',
              items: {
                type: 'string'
              },
              minItems: 2,
              maxItems: 4
            }
          },
          required: ['suggestions']
        }
      }
    } : null;

    // Built-in tool to mark conversation as complete (triggers satisfaction rating)
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    
    const markCompleteTool = {
      type: 'function',
      function: {
        name: 'mark_conversation_complete',
        description: `Intelligently determine if a conversation has reached a natural conclusion. Current conversation has ${userMessageCount} user messages.

COMPLETION CRITERIA (Intercom-style):
1. EXPLICIT FAREWELL + 1+ exchanges = HIGH confidence
   - Clear farewell phrases: "goodbye", "bye", "thanks, that's all", "perfect, thank you", "have a great day", "take care", "got what I needed", "all set", "you've been helpful"
   
2. STANDARD COMPLETION (3+ exchanges) = HIGH confidence
   - User expresses satisfaction
   - No pending questions
   - Original inquiry addressed

HIGH CONFIDENCE SIGNALS:
- Explicit farewell phrase WITH positive sentiment (even in short conversations)
- "Thanks, that's exactly what I needed!", "Perfect, you've been very helpful!"
- "Great, I'm all set now", "That answers my question"
- "Goodbye", "Take care", "Have a nice day"

NEGATIVE SIGNALS (DO NOT mark complete):
- "Thanks" followed by "but...", "however...", "one more thing..."
- Question marks after acknowledgment
- "I have another question", "Also...", "What about..."
- User frustration or confusion
- Conversation ends mid-topic

MEDIUM CONFIDENCE (log only):
- Just "ok", "thanks", "got it" without elaboration
- User appears satisfied but no explicit confirmation

NEVER mark complete when:
- User is frustrated or upset
- There are unanswered questions
- Still actively exploring a topic`,
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Detailed explanation of why the conversation appears complete'
            },
            confidence: {
              type: 'string',
              enum: ['high', 'medium'],
              description: 'HIGH: Explicit farewell + 1+ exchanges, OR 3+ exchanges with satisfaction. MEDIUM: Likely complete but ambiguous.'
            },
            user_signal: {
              type: 'string',
              description: 'The specific phrase from the user that indicates completion (quote directly)'
            },
            sentiment: {
              type: 'string',
              enum: ['satisfied', 'neutral', 'uncertain', 'frustrated'],
              description: 'Overall sentiment based on final messages'
            },
            has_pending_questions: {
              type: 'boolean',
              description: 'Whether user has unanswered questions'
            }
          },
          required: ['reason', 'confidence', 'user_signal', 'sentiment']
        }
      }
    };

    // Combine built-in tools with user-defined tools (only include quick replies if enabled)
    const allTools = [
      ...(quickRepliesTool ? [quickRepliesTool] : []),
      markCompleteTool, // Always include mark_conversation_complete
      ...(formattedTools || [])
    ];
    
    // PHASE 7: Only add tools if there are any (skip entirely for lite model with no user tools)
    if (allTools.length > 0) {
      aiRequestBody.tools = allTools;
      aiRequestBody.tool_choice = 'auto';
    }
    
    console.log(`Quick replies: ${shouldIncludeQuickReplies ? 'enabled' : 'disabled'} (tier=${modelTier}, config=${enableQuickReplies})`);

    // Call OpenRouter API
    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://getpilot.io',
        'X-Title': 'Pilot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', conversationId: activeConversationId }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits exhausted. Please add funds to continue.', conversationId: activeConversationId }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    let aiResponse = await response.json();
    let assistantMessage = aiResponse.choices?.[0]?.message;
    let assistantContent = assistantMessage?.content || '';
    const toolsUsed: { name: string; success: boolean }[] = [];
    let quickReplies: string[] = [];
    let aiMarkedComplete = false;
    let storedShownProperties: ShownProperty[] | undefined;
    let lastCalendarResult: any = null;
    let lastBookingResult: any = null;

    // ============================================
    // PHASE 4: Use executeToolCalls handler
    // ============================================
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResult = await executeToolCalls(supabase, {
        assistantMessage,
        assistantContent,
        aiRequestBody,
        activeConversationId,
        agentId,
        supabaseUrl,
        enabledTools,
        previewMode: !!previewMode,
        conversationMetadata,
        openRouterApiKey: OPENROUTER_API_KEY,
      });

      assistantContent = toolResult.assistantContent;
      toolsUsed.push(...toolResult.toolsUsed);
      quickReplies = toolResult.quickReplies;
      aiMarkedComplete = toolResult.aiMarkedComplete;
      storedShownProperties = toolResult.storedShownProperties;
      lastCalendarResult = toolResult.lastCalendarResult;
      lastBookingResult = toolResult.lastBookingResult;
    }

    // Fallback if no content
    if (!assistantContent) {
      assistantContent = 'I apologize, but I was unable to generate a response.';
    }

    // ============================================
    // PHASE 4: Use postProcessResponse handler
    // ============================================
    const { sanitizedContent, isBlocked } = await postProcessResponse({
      assistantContent,
      conversationId: activeConversationId,
      requestId,
      agentId,
      previewMode: !!previewMode,
      supabase,
    });
    assistantContent = sanitizedContent;

    // ============================================
    // PHASE 4: Use addTypingDelay handler
    // ============================================
    await addTypingDelay();

    // ============================================
    // PHASE 4: Use cacheResponseIfEligible handler
    // ============================================
    cacheResponseIfEligible(supabase, queryHash, agentId, assistantContent, maxSimilarity);

    // ============================================
    // PHASE 4: Use saveResponseChunks handler
    // ============================================
    const { chunks, assistantMessageIds, linkPreviews } = await saveResponseChunks({
      supabase,
      conversationId: activeConversationId,
      content: assistantContent,
      selectedModel,
      modelTier,
      sources,
      toolsUsed,
      supabaseUrl,
      supabaseKey,
      previewMode: !!previewMode,
    });

    const assistantMessageId = assistantMessageIds[assistantMessageIds.length - 1];

    // ============================================
    // PHASE 4: Use updateConversationMetadata handler
    // ============================================
    await updateConversationMetadata({
      supabase,
      conversationId: activeConversationId,
      conversationMetadata,
      assistantContent,
      pageVisits,
      storedShownProperties,
      messagesToSend,
      openRouterApiKey: OPENROUTER_API_KEY,
      previewMode: !!previewMode,
    });

    // ============================================
    // PHASE 4: Use trackUsage handler
    // ============================================
    trackUsage({
      supabase,
      userId: agent.user_id,
      currentApiCalls,
      currentMessagesCount,
      previewMode: !!previewMode,
    });

    // ============================================
    // PHASE 4: Use extractMemories handler
    // ============================================
    extractMemories({
      supabase,
      agentId,
      conversationId: activeConversationId,
      messages,
      assistantContent,
      conversationMetadata,
      openRouterApiKey: OPENROUTER_API_KEY,
      isGreetingRequest,
      previewMode: !!previewMode,
    });

    // ============================================
    // PHASE 4: Use buildFinalResponse handler
    // ============================================
    return buildFinalResponse({
      conversationId: activeConversationId,
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
      totalDuration: performance.now() - startTime,
      previewMode: !!previewMode,
      log,
    });
  } catch (error) {
    const totalDuration = performance.now() - startTime;
    log.error('Request failed', { 
      error: error.message,
      durationMs: Math.round(totalDuration),
    });
    
    // Create agent error notification (fire and forget)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const errorSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Try to get agent info from request body for notification
      const body = await new Response(error.body).json().catch(() => ({}));
      if (body.agentId) {
        const { data: agent } = await errorSupabase
          .from('agents')
          .select('user_id, name')
          .eq('id', body.agentId)
          .single();
        
        if (agent) {
          await errorSupabase.from('notifications').insert({
            user_id: agent.user_id,
            type: 'agent',
            title: 'Agent Error',
            message: `Agent "${agent.name}" encountered an error while responding`,
            data: { agent_id: body.agentId, error: error.message, requestId },
            read: false
          });
          log.info('Agent error notification created');
        }
      }
    } catch (notifError) {
      log.error('Failed to create error notification', { error: notifError.message });
    }
    
    return createErrorResponse(
      requestId,
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'An error occurred',
      500,
      totalDuration
    );
  }
});
