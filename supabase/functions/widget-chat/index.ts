import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ============================================
// SHARED MODULES (Phase 1 + Phase 2 + Phase 3 Extraction)
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
// PHASE 3 COMPLETE: All utility, AI, tools, and memory functions
// are now imported from _shared/ modules above.
// ============================================

// Local function selectModelTier kept for backward compatibility
// (uses imports from _shared/ai/model-routing.ts)
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

// ============================================
// CUSTOM TOOL SECURITY & RELIABILITY
// ============================================

// SSRF Protection: Block access to private IPs, localhost, and cloud metadata endpoints
const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\.\d+\.\d+\.\d+/i,
  /^https?:\/\/0\.0\.0\.0/i, // Bind-all address
  /^https?:\/\/10\.\d+\.\d+\.\d+/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/i,
  /^https?:\/\/192\.168\.\d+\.\d+/i,
  /^https?:\/\/169\.254\.\d+\.\d+/i, // Link-local
  /^https?:\/\/\[::1\]/i, // IPv6 localhost
  /^https?:\/\/\[fe80:/i, // IPv6 link-local
  /^https?:\/\/\[fc00:/i, // IPv6 unique local address
  /^https?:\/\/fd00:/i, // Private IPv6
  /^https?:\/\/metadata\.google\.internal/i,
  /^https?:\/\/metadata\.goog/i, // GCP alternative
  /^https?:\/\/instance-data/i, // AWS alternative hostname
  /^https?:\/\/169\.254\.169\.254/i, // AWS/GCP metadata
  /^https?:\/\/100\.100\.100\.200/i, // Alibaba metadata
];

/**
 * Check if a URL is blocked for SSRF protection
 */
function isBlockedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Block non-HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return true;
    }
    // Check against blocked patterns
    return BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
  } catch {
    return true; // Invalid URLs are blocked
  }
}

// Response size limit (1MB) to prevent memory issues
const MAX_RESPONSE_SIZE_BYTES = 1 * 1024 * 1024;

// Retry configuration
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 500;

// Headers that should be masked in logs
const SENSITIVE_HEADER_PATTERNS = [
  /^authorization$/i,
  /^x-api-key$/i,
  /^api-key$/i,
  /^bearer$/i,
  /^token$/i,
  /^secret$/i,
  /^password$/i,
  /^credential/i,
];

/**
 * Mask sensitive header values for logging
 */
function maskHeadersForLogging(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const isSensitive = SENSITIVE_HEADER_PATTERNS.some(pattern => pattern.test(key));
    masked[key] = isSensitive ? `***${value.slice(-4)}` : value;
  }
  return masked;
}

/**
 * Delay helper for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call a tool endpoint with retry logic, SSRF protection, and response size limits
 */
async function callToolEndpoint(
  tool: { name: string; endpoint_url: string; headers: any; timeout_ms: number },
  args: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  // SSRF Protection: Validate URL before making request
  if (isBlockedUrl(tool.endpoint_url)) {
    console.error(`Tool ${tool.name} blocked: URL fails SSRF validation`, { url: tool.endpoint_url });
    return { success: false, error: 'Tool endpoint URL is not allowed (security restriction)' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(tool.headers || {}),
  };

  // Log with masked headers for security
  const maskedHeaders = maskHeadersForLogging(headers);
  console.log(`Calling tool ${tool.name} at ${tool.endpoint_url}`, { 
    args, 
    headers: maskedHeaders,
    timeout_ms: tool.timeout_ms 
  });

  let lastError: string = 'Unknown error';
  
  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add backoff delay for retries
      if (attempt > 0) {
        const backoffMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Tool ${tool.name} retry ${attempt}/${MAX_RETRIES} after ${backoffMs}ms`);
        await delay(backoffMs);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), tool.timeout_ms || 10000);

      const response = await fetch(tool.endpoint_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(args),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check response size from Content-Length header first
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE_BYTES) {
        console.error(`Tool ${tool.name} response too large: ${contentLength} bytes`);
        return { success: false, error: `Response too large (max ${MAX_RESPONSE_SIZE_BYTES / 1024 / 1024}MB)` };
      }

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
        
        // Only retry on 5xx errors or network issues, not on 4xx client errors
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          console.warn(`Tool ${tool.name} server error (attempt ${attempt + 1}):`, response.status);
          continue;
        }
        
        console.error(`Tool ${tool.name} returned error:`, response.status, errorText.substring(0, 500));
        return { success: false, error: lastError };
      }

      // Read response with size limit
      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'No response body' };
      }

      let totalBytes = 0;
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        totalBytes += value.length;
        if (totalBytes > MAX_RESPONSE_SIZE_BYTES) {
          reader.cancel();
          console.error(`Tool ${tool.name} response exceeded size limit during read`);
          return { success: false, error: `Response too large (max ${MAX_RESPONSE_SIZE_BYTES / 1024 / 1024}MB)` };
        }
        
        chunks.push(value);
      }

      // Combine chunks and parse JSON
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      const responseText = new TextDecoder().decode(combined);
      const result = JSON.parse(responseText);
      
      console.log(`Tool ${tool.name} returned successfully`, { 
        responseSize: totalBytes,
        attempts: attempt + 1 
      });
      return { success: true, result };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        lastError = 'Request timed out';
        console.error(`Tool ${tool.name} timed out after ${tool.timeout_ms}ms (attempt ${attempt + 1})`);
        // Retry on timeout
        if (attempt < MAX_RETRIES) continue;
      } else if (error instanceof SyntaxError) {
        // JSON parse error - don't retry
        console.error(`Tool ${tool.name} returned invalid JSON:`, error.message);
        return { success: false, error: 'Invalid JSON response from tool' };
      } else {
        lastError = error.message || 'Unknown error';
        console.error(`Tool ${tool.name} error (attempt ${attempt + 1}):`, error);
        // Retry on network errors
        if (attempt < MAX_RETRIES) continue;
      }
    }
  }

  // All retries exhausted
  console.error(`Tool ${tool.name} failed after ${MAX_RETRIES + 1} attempts:`, lastError);
  return { success: false, error: lastError };
}

serve(async (req) => {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  const log = createLogger(requestId);
  const timings: Record<string, number> = {};
  
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
    const enabledTools = (agentTools || []).filter(tool => tool.endpoint_url);
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

    // Create or get conversation (skip for preview mode)
    let activeConversationId = conversationId;
    
    // Preview mode: skip all persistence, use ephemeral conversation
    if (previewMode) {
      log.info('Preview mode - skipping conversation persistence');
      activeConversationId = `preview-${crypto.randomUUID()}`;
    } else if (!activeConversationId || activeConversationId === 'new' || activeConversationId.startsWith('conv_') || activeConversationId.startsWith('migrated_')) {
      // Create a new conversation in the database
      const conversationMetadata: any = {
        ip_address: ipAddress,
        country,
        city,
        country_code: countryCode,
        region,
        device,
        browser,
        os,
        referer_url: referer,
        session_started_at: new Date().toISOString(),
        lead_id: leadId || null,
        tags: [],
        messages_count: 0,
        visited_pages: [] as Array<{ url: string; entered_at: string; duration_ms: number }>,
        visitor_id: visitorId || null,
      };

      // Add referrer journey if provided
      if (referrerJourney) {
        conversationMetadata.referrer_journey = {
          referrer_url: referrerJourney.referrer_url || null,
          landing_page: referrerJourney.landing_page || null,
          utm_source: referrerJourney.utm_source || null,
          utm_medium: referrerJourney.utm_medium || null,
          utm_campaign: referrerJourney.utm_campaign || null,
          utm_term: referrerJourney.utm_term || null,
          utm_content: referrerJourney.utm_content || null,
          entry_type: referrerJourney.entry_type || 'direct',
        };
        console.log('Added referrer journey to new conversation:', conversationMetadata.referrer_journey);
      }

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          user_id: agent.user_id,
          status: 'active',
          metadata: conversationMetadata,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }

      activeConversationId = newConversation.id;
      console.log(`Created new conversation: ${activeConversationId}`);
    }

    // Check conversation status (for human takeover) - skip for preview mode
    let conversation: { status: string; metadata: any } | null = null;
    if (!previewMode) {
      const { data: convData } = await supabase
        .from('conversations')
        .select('status, metadata')
        .eq('id', activeConversationId)
        .single();
      conversation = convData;

      if (conversation?.status === 'human_takeover') {
        // Don't call AI - just save the user message and return
        if (messages && messages.length > 0) {
          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage.role === 'user') {
            await supabase.from('messages').insert({
              conversation_id: activeConversationId,
              role: 'user',
              content: lastUserMessage.content,
              metadata: { 
                source: 'widget',
                files: lastUserMessage.files || undefined,
              }
            });

            // Update conversation metadata
            const currentMetadata = conversation.metadata || {};
            await supabase
              .from('conversations')
              .update({
                metadata: {
                  ...currentMetadata,
                  messages_count: (currentMetadata.messages_count || 0) + 1,
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', activeConversationId);
          }
        }

        // Fetch the team member who took over
        let takenOverBy = null;
        const { data: takeover } = await supabase
          .from('conversation_takeovers')
          .select('taken_over_by')
          .eq('conversation_id', activeConversationId)
          .is('returned_to_ai_at', null)
          .order('taken_over_at', { ascending: false })
          .limit(1)
          .single();
        
        if (takeover?.taken_over_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', takeover.taken_over_by)
            .single();
          
          if (profile) {
            takenOverBy = {
              name: profile.display_name || 'Team Member',
              avatar: profile.avatar_url,
            };
          }
        }

        return new Response(
          JSON.stringify({
            conversationId: activeConversationId,
            status: 'human_takeover',
            takenOverBy,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if conversation is closed - save message but return friendly notice
      if (conversation?.status === 'closed') {
        console.log('Conversation is closed, saving message but not calling AI');
        
        // Still save the user message for context
        if (messages && messages.length > 0) {
          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage.role === 'user') {
            await supabase.from('messages').insert({
              conversation_id: activeConversationId,
              role: 'user',
              content: lastUserMessage.content,
              metadata: { 
                source: 'widget',
                files: lastUserMessage.files || undefined,
              }
            });
          }
        }

        return new Response(
          JSON.stringify({
            conversationId: activeConversationId,
            status: 'closed',
            response: 'This conversation has been closed. Please start a new conversation if you need further assistance.',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if this is a greeting request (special message to trigger AI greeting)
    const isGreetingRequest = messages && messages.length === 1 && 
      messages[0].role === 'user' && 
      messages[0].content === '__GREETING_REQUEST__';
    
    // Save the user message to database (skip for greeting requests and preview mode)
    let userMessageId: string | undefined;
    let userMessageBlocked = false;
    if (messages && messages.length > 0 && !isGreetingRequest && !previewMode) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        // PRE-FLIGHT CONTENT MODERATION: Check user message before processing
        const userModeration = await moderateContent(lastUserMessage.content);
        if (userModeration.action === 'block') {
          console.warn(`[${requestId}] Content blocked: User message flagged for ${userModeration.categories.join(', ')}`);
          // Log security event
          supabase.from('security_logs').insert({
            action: 'content_blocked',
            resource_type: 'conversation',
            resource_id: activeConversationId,
            success: true,
            details: { 
              type: 'user_message',
              categories: userModeration.categories,
              severity: userModeration.severity,
              request_id: requestId,
              agent_id: agentId,
            },
          }).then(() => {
            console.log(`[${requestId}] Security event logged: content_blocked (user)`);
          }).catch(err => {
            console.error(`[${requestId}] Failed to log security event:`, err);
          });
          
          userMessageBlocked = true;
        } else if (userModeration.action === 'warn') {
          // Log warning but allow message
          console.warn(`[${requestId}] Content warning: User message flagged for ${userModeration.categories.join(', ')}`);
          supabase.from('security_logs').insert({
            action: 'content_warning',
            resource_type: 'conversation',
            resource_id: activeConversationId,
            success: true,
            details: { 
              type: 'user_message',
              categories: userModeration.categories,
              severity: userModeration.severity,
              request_id: requestId,
              agent_id: agentId,
            },
          }).catch(err => {
            console.error(`[${requestId}] Failed to log content warning:`, err);
          });
        }
        const { data: userMsg, error: msgError } = await supabase.from('messages').insert({
          conversation_id: activeConversationId,
          role: 'user',
          content: lastUserMessage.content,
          metadata: { 
            source: 'widget',
            files: lastUserMessage.files || undefined,
          }
        }).select('id').single();
        
        if (msgError) {
          console.error('Error saving user message:', msgError);
        } else {
          userMessageId = userMsg?.id;
        }
        
        // Update last_user_message_at immediately when user message is saved
        const currentMeta = conversation?.metadata || {};
        await supabase
          .from('conversations')
          .update({
            metadata: {
              ...currentMeta,
              last_user_message_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeConversationId);
      }
    }

    // Early return if user message was blocked by content moderation
    if (userMessageBlocked) {
      return new Response(
        JSON.stringify({
          conversationId: activeConversationId,
          response: "I'm not able to respond to that type of message. How else can I help you today?",
          sources: [],
          status: 'active',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ============================================
    // PHASE 1: DATABASE-FIRST MESSAGE FETCHING
    // Fetch conversation history from database (source of truth)
    // instead of trusting client-provided message history
    // (Skip for preview mode - ephemeral, no history)
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

    let systemPrompt = agent.system_prompt || 'You are a helpful AI assistant.';
    let sources: any[] = [];
    let queryHash: string | null = null;
    let maxSimilarity = 0;
    // PHASE 4: Track semantic memories for prompt injection
    let retrievedMemories: SemanticMemory[] = [];
    let queryEmbeddingForMemory: number[] | null = null;

    // RAG: Search knowledge base if there are user messages (skip for greeting requests)
    if (messages && messages.length > 0 && !isGreetingRequest) {
      // Get the last user message for RAG search
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
      
      if (lastUserMessage && lastUserMessage.content) {
        try {
          const queryContent = lastUserMessage.content;
          const normalizedQuery = normalizeQuery(queryContent);
          queryHash = await hashQuery(normalizedQuery + ':' + agentId);
          
          console.log('Query normalized for cache lookup:', normalizedQuery.substring(0, 50));
          
          // COST OPTIMIZATION: Check response cache first (AGGRESSIVE - lowered from 0.92 to 0.70)
          // Skip cache for preview mode - always call AI
          const cachedResponse = previewMode ? null : await getCachedResponse(supabase, queryHash, agentId);
          if (cachedResponse && cachedResponse.similarity > 0.70) {
            console.log('CACHE HIT: Returning cached response, skipping AI call entirely');
            
            // Save user message (skip for preview mode)
            if (messages && messages.length > 0 && !previewMode) {
              await supabase.from('messages').insert({
                conversation_id: activeConversationId,
                role: 'user',
                content: queryContent,
                metadata: { source: 'widget' }
              });
            }
            
            // Save cached response as assistant message (skip for preview mode)
            if (!previewMode) {
              await supabase.from('messages').insert({
                conversation_id: activeConversationId,
                role: 'assistant',
                content: cachedResponse.content,
                metadata: { source: 'cache', cache_similarity: cachedResponse.similarity }
              });
            }
            
            return new Response(
              JSON.stringify({
                conversationId: previewMode ? null : activeConversationId,
                response: cachedResponse.content,
                cached: true,
                similarity: cachedResponse.similarity,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // COST OPTIMIZATION: Check embedding cache before generating new embedding
          let queryEmbedding = await getCachedEmbedding(supabase, queryHash, agentId);
          
          if (queryEmbedding) {
            console.log('Embedding CACHE HIT - saved 1 embedding API call');
          } else {
            console.log('Generating new embedding for query:', queryContent.substring(0, 100));
            queryEmbedding = await generateEmbedding(queryContent);
            
            // Cache the embedding for future use
            cacheQueryEmbedding(supabase, queryHash, normalizedQuery, queryEmbedding, agentId);
          }
          
          // RAG threshold tuned for Qwen3 embeddings (industry standard: 0.40-0.50)
          // Higher thresholds (0.70+) cause most semantically relevant content to be missed
          const queryLength = queryContent.split(' ').length;
          const matchThreshold = queryLength < 5 ? 0.50 : queryLength < 15 ? 0.45 : 0.40;
          // PHASE 6: Limit match count to MAX_RAG_CHUNKS (3) to reduce input tokens
          const matchCount = MAX_RAG_CHUNKS;
          
          console.log(`Dynamic RAG params: threshold=${matchThreshold}, count=${matchCount} (query length: ${queryLength} words)`);
          
          // Search for relevant knowledge sources
          const knowledgeResults = await searchKnowledge(
            supabase,
            agentId,
            queryEmbedding,
            matchThreshold,
            matchCount
          );

          console.log(`Found ${knowledgeResults.length} relevant knowledge sources`);
          
          // PHASE 4: Search for semantic memories related to this query
          const leadId = (conversation?.metadata as ConversationMetadata)?.lead_id;
          const semanticMemories = await searchSemanticMemories(
            supabase,
            agentId,
            leadId || null,
            activeConversationId || null,
            queryEmbedding,
            0.6, // Memory match threshold
            5    // Max memories to retrieve
          );
          
          if (semanticMemories.length > 0) {
            console.log(`PHASE 4: Found ${semanticMemories.length} relevant semantic memories`);
            retrievedMemories = semanticMemories;
          }
          
          // Store embedding for potential memory extraction later
          queryEmbeddingForMemory = queryEmbedding;

          // If relevant knowledge found, inject into system prompt
          if (knowledgeResults && knowledgeResults.length > 0) {
            // Track max similarity for response caching decision
            maxSimilarity = Math.max(...knowledgeResults.map((r: any) => r.similarity));
            
            sources = knowledgeResults.map((result: any) => ({
              source: result.source,
              type: result.type,
              similarity: result.similarity,
              url: result.sourceUrl, // Include source URL for AI to reference
            }));

            // Secondary filter: exclude very low relevance matches
            const relevantChunks = knowledgeResults.filter((r: any) => r.similarity > 0.35);
            
            if (relevantChunks.length > 0) {
              const knowledgeContext = relevantChunks
                .map((result: any, index: number) => {
                  const chunkInfo = result.chunkIndex !== undefined ? ` - Section ${result.chunkIndex + 1}` : '';
                  const urlInfo = result.sourceUrl ? ` | URL: ${result.sourceUrl}` : '';
                  return `[Source ${index + 1}: ${result.source}${chunkInfo}${urlInfo} (${result.type}, relevance: ${(result.similarity * 100).toFixed(0)}%)]
${result.content}`;
                })
                .join('\n\n---\n\n');

              systemPrompt = `${agent.system_prompt || 'You are a helpful AI assistant.'}

KNOWLEDGE BASE CONTEXT:
The following information from our knowledge base may be relevant to answering the user's question. Use this context to provide accurate, informed responses. If the context doesn't contain relevant information for the user's question, you can answer based on your general knowledge but mention that you're not finding specific information in the knowledge base.

${knowledgeContext}

---

IMPORTANT GUIDELINES FOR RESPONSES:
1. When referencing information from sources, cite naturally (e.g., "According to our docs...").
2. **LINKS ON THEIR OWN LINE**: Put source URLs on a separate line, never buried in paragraphs:
   ✓ "Learn more: https://example.com"
   ✗ "You can read about this at https://example.com to learn more."
3. Include links for EVERY knowledge source referenced.
4. Multiple relevant sources = multiple links on separate lines.`;
            }
          }
        } catch (ragError) {
          // Log RAG errors but don't fail the request
          console.error('RAG error (continuing without knowledge):', ragError);
        }
      }
    }

    // Extract user context from conversation metadata (lead form data)
    const conversationMetadata = (conversation?.metadata || {}) as ConversationMetadata;
    let userContextSection = '';
    
    // Detect initial message/inquiry from custom fields
    // These are fields where the user explains why they're reaching out
    let initialUserMessage: string | null = null;
    const messageFieldPatterns = /message|question|help|inquiry|reason|about|need|looking for|interest|details|describe|explain|issue|problem|request|comment/i;
    
    // Create a copy of custom fields to process
    const processedCustomFields: Record<string, string> = {};
    
    if (conversationMetadata.custom_fields) {
      for (const [label, value] of Object.entries(conversationMetadata.custom_fields)) {
        if (value && typeof value === 'string' && value.trim()) {
          // Check if this looks like an initial message field
          // Typically these are longer text fields where user explains their need
          const isMessageField = messageFieldPatterns.test(label) && value.length > 20;
          
          if (isMessageField && !initialUserMessage) {
            initialUserMessage = value as string;
            console.log(`Detected initial user message from field "${label}": "${value.substring(0, 50)}..."`);
          } else {
            processedCustomFields[label] = value;
          }
        }
      }
    }
    
    // Check if we have meaningful user context to add
    const hasUserName = conversationMetadata.lead_name;
    const hasCustomFields = Object.keys(processedCustomFields).length > 0;
    
    if (hasUserName || hasCustomFields || initialUserMessage) {
      userContextSection = `

USER INFORMATION (from contact form):`;
      
      if (conversationMetadata.lead_name) {
        userContextSection += `\n- Name: ${conversationMetadata.lead_name}`;
      }
      if (conversationMetadata.lead_email) {
        userContextSection += `\n- Email: ${conversationMetadata.lead_email}`;
      }
      
      // Add location if available
      const location = conversationMetadata.city && conversationMetadata.country 
        ? `${conversationMetadata.city}, ${conversationMetadata.country}` 
        : conversationMetadata.country || null;
      if (location) {
        userContextSection += `\n- Location: ${location}`;
      }
      
      // Add remaining custom fields (excluding the initial message)
      for (const [label, value] of Object.entries(processedCustomFields)) {
        userContextSection += `\n- ${label}: ${value}`;
      }
      
      userContextSection += `

Use this information to personalize your responses when appropriate (e.g., address them by name, reference their company or interests). Be natural about it - don't force personalization if it doesn't fit the conversation.`;
      
      // Add initial user inquiry as a distinct, prominent section
      if (initialUserMessage) {
        userContextSection += `

INITIAL USER INQUIRY (from contact form):
"${initialUserMessage}"

This is what the user wanted to discuss when they started the chat. Treat this as their first question - address it directly in your response. Do NOT ask "how can I help?" when they've already told you what they need.`;
      }
      
      console.log('Added user context to system prompt', { hasInitialMessage: !!initialUserMessage });
    }

    // Append user context to system prompt
    if (userContextSection) {
      systemPrompt = systemPrompt + userContextSection;
    }
    
    // PHASE 4: Inject semantic memories into system prompt
    if (retrievedMemories.length > 0) {
      const memoriesContext = formatMemoriesForPrompt(retrievedMemories);
      if (memoriesContext) {
        systemPrompt = systemPrompt + `

REMEMBERED CONTEXT (from previous conversations):
${memoriesContext}

Use this remembered information naturally when relevant. Don't explicitly say "I remember you said..." unless it's conversationally appropriate.`;
        console.log(`PHASE 4: Injected ${retrievedMemories.length} memories into system prompt`);
      }
    }
    
    // PHASE 8: Append formatting rules for digestible responses
    systemPrompt = systemPrompt + RESPONSE_FORMATTING_RULES;

    // SECURITY: Append security guardrails to prevent prompt injection (appended last for maximum effectiveness)
    systemPrompt = systemPrompt + SECURITY_GUARDRAILS;

    // LANGUAGE MATCHING: Always respond in the user's language
    systemPrompt += `

LANGUAGE: Always respond in the same language the user is writing in. If they write in Spanish, respond in Spanish. If they write in Portuguese, respond in Portuguese. Match their language naturally without mentioning that you're doing so.`;

    // PROPERTY TOOLS INSTRUCTIONS: When agent has locations, instruct AI to use property tools
    if (hasLocations) {
      // Check if we have shown properties in context for reference resolution
      const shownProperties = conversationMetadata?.shown_properties as ShownProperty[] | undefined;
      let shownPropertiesContext = '';
      
      if (shownProperties && shownProperties.length > 0) {
        shownPropertiesContext = `

RECENTLY SHOWN PROPERTIES (use these for booking/reference):
${shownProperties.map(p => 
  `${p.index}. ${p.address}, ${p.city}, ${p.state} - ${p.beds || '?'}bed/${p.baths || '?'}bath ${p.price_formatted} (ID: ${p.id})${p.community ? ` [${p.community}]` : ''}${p.location_id ? ` (Location: ${p.location_id})` : ''}`
).join('\n')}

PROPERTY REFERENCE RESOLUTION:
When the user refers to a previously shown property (e.g., "the first one", "the 2-bed", "the one on Main St"):
1. Match their reference to one of the RECENTLY SHOWN PROPERTIES above
2. Match by: index number (1st, 2nd, first, second), address substring, beds/baths, price, or community
3. Use the property's ID directly for booking - do NOT ask user to confirm the address you already showed them
4. If truly unclear which property they mean, ask for clarification with the numbered list

DIRECT BOOKING WITH LOCATION_ID:
When scheduling a tour for a shown property:
- If the property has a Location ID in parentheses above, use it DIRECTLY with book_appointment (location_id parameter)
- This enables instant booking without needing to call check_calendar_availability first
- If no Location ID is shown, use check_calendar_availability with the property's city/state to find the right location

Examples:
- "I'd like to tour the first one" → Use property #1's ID and location_id from the list above
- "What about the 2-bedroom?" → Match to property with 2 beds from the list
- "Schedule a tour for the one on Oak Street" → Match by address containing "Oak", use its location_id
- "How about the cheaper one?" → Match to lowest priced property in the list`;
        console.log(`Injected ${shownProperties.length} shown properties into context`);
      }
      
      // Tools are now self-documenting with TRIGGERS, EXAMPLES, WORKFLOW, and DO NOT USE sections
      // No need for redundant manual instructions here - the AI reads tool descriptions directly
      systemPrompt += `

PROPERTY & BOOKING TOOLS AVAILABLE:
You have access to real-time tools for properties, locations, and bookings. Each tool's description contains:
• TRIGGERS: When to use it
• EXAMPLES: Sample queries
• WORKFLOW: How it fits with other tools
• DO NOT USE: When to avoid it

Read each tool's description carefully to understand when and how to use it.
DO NOT rely solely on knowledge base context - use the tools for live data.${shownPropertiesContext}`;
      
      console.log('Added property tool instructions to system prompt');
    }

    // PHASE 1: Use database conversation history (source of truth) instead of client messages
    // PHASE 2: Intelligent summarization instead of hard truncation
    const rawHistory = dbConversationHistory.length > 0 ? dbConversationHistory : messages;
    
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
      aiRequestBody.top_p = deploymentConfig.top_p || 1.0;
    }
    if (modelCaps.presencePenalty.supported) {
      aiRequestBody.presence_penalty = deploymentConfig.presence_penalty || 0;
    }
    if (modelCaps.frequencyPenalty.supported) {
      aiRequestBody.frequency_penalty = deploymentConfig.frequency_penalty || 0;
    }
    if (modelCaps.topK.supported && deploymentConfig.top_k) {
      aiRequestBody.top_k = deploymentConfig.top_k;
    }
    
    console.log(`Model capabilities applied: topP=${modelCaps.topP.supported}, penalties=${modelCaps.presencePenalty.supported}, topK=${modelCaps.topK.supported}`);

    // PHASE 7: Skip quick replies for lite model tier (reduces tool call overhead)
    // Also check agent config for enable_quick_replies setting (defaults to true)
    const enableQuickReplies = deploymentConfig.enable_quick_replies !== false;
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
    // Calculate conversation length for context (user messages only)
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
    let aiMarkedComplete = false; // Track if AI called mark_conversation_complete with high confidence
    // Track shown properties - declared OUTSIDE if-block so it persists to final metadata update
    let storedShownProperties: ShownProperty[] | undefined;
    
    // Track booking tool results for UI component transformation
    let lastCalendarResult: any = null;
    let lastBookingResult: any = null;

    // Handle tool calls if AI decided to use tools
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`AI requested ${assistantMessage.tool_calls.length} tool call(s)`);
      
      // PHASE 3: Fetch recent tool calls for redundancy check
      const recentToolMessages = await getRecentToolCalls(supabase, activeConversationId, 10);
      let redundantCallsSkipped = 0;
      
      const toolResults: any[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function?.name;
        const toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
        
        // Handle built-in quick replies tool
        if (toolName === 'suggest_quick_replies') {
          console.log('AI suggested quick replies:', toolArgs.suggestions);
          quickReplies = (toolArgs.suggestions || []).slice(0, 4).map((s: string) => 
            s.length > 40 ? s.substring(0, 37) + '...' : s
          );
          // Don't add to toolResults - this is a client-side only tool
          continue;
        }
        
        // Handle built-in mark_conversation_complete tool
        if (toolName === 'mark_conversation_complete') {
          console.log('AI called mark_conversation_complete:', JSON.stringify(toolArgs, null, 2));
          
          const sentiment = toolArgs.sentiment || 'neutral';
          const hasPendingQuestions = toolArgs.has_pending_questions || false;
          const userSignal = toolArgs.user_signal || '';
          
          // Intercom-style: Explicit farewell patterns that can trigger completion with fewer exchanges
          // Includes contextual dismissals like "no", "nope", "nothing else" for "anything else?" responses
          const EXPLICIT_FAREWELL_PATTERNS = /\b(goodbye|bye|no(\s+(thanks?|thank you))?|nope|nothing(\s+else)?|not (right now|at the moment|at this time)|thanks[\s,!.]+that'?s?\s*(all|it|perfect|great|exactly|what i needed)|have a (great|good|nice) (day|one)|take care|perfect[\s,!.]+thank|got (it|what i needed)|all set|that answers|you'?ve been (very )?helpful|that'?s? (all|exactly|perfect|great)|i'?m (all )?set)\b/i;
          
          const hasExplicitFarewell = EXPLICIT_FAREWELL_PATTERNS.test(userSignal);
          const meetsMinimumExchanges = userMessageCount >= 1; // At least 1 exchange for farewell path
          const meetsStandardExchanges = userMessageCount >= 3; // Standard path needs 3+
          const hasPositiveSentiment = sentiment === 'satisfied' || sentiment === 'neutral';
          const noPendingQuestions = !hasPendingQuestions;
          
          // Additional signal validation: check for question marks or "but" patterns in user signal
          const hasNegativePattern = /\?|but\s|however\s|also\s|what about|one more/i.test(userSignal);
          
          // Intercom-style completion logic:
          // Path 1: Explicit farewell + at least 1 exchange + positive sentiment + no pending questions
          // Path 2: Standard 3+ exchanges with satisfaction (original logic)
          const canCompleteWithFarewell = hasExplicitFarewell && meetsMinimumExchanges && hasPositiveSentiment && noPendingQuestions && !hasNegativePattern;
          const canCompleteStandard = meetsStandardExchanges && hasPositiveSentiment && noPendingQuestions && !hasNegativePattern;
          
          const canComplete = toolArgs.confidence === 'high' && (canCompleteWithFarewell || canCompleteStandard);
          
          if (canComplete) {
            aiMarkedComplete = true;
            const completionPath = canCompleteWithFarewell ? 'farewell_detected' : 'standard_exchanges';
            console.log(`Conversation marked complete with HIGH confidence (${completionPath})`, {
              reason: toolArgs.reason,
              userSignal,
              sentiment,
              userMessageCount,
              hasPendingQuestions,
              hasExplicitFarewell,
              completionPath,
            });
            
            // Update conversation metadata with rich completion context
            const currentMeta = conversation?.metadata || {};
            await supabase
              .from('conversations')
              .update({
                metadata: {
                  ...currentMeta,
                  ai_marked_complete: true,
                  ai_complete_reason: toolArgs.reason,
                  ai_complete_at: new Date().toISOString(),
                  ai_complete_signal: userSignal,
                  ai_complete_sentiment: sentiment,
                  ai_complete_exchange_count: userMessageCount,
                  ai_complete_path: completionPath,
                },
              })
              .eq('id', activeConversationId);
          } else {
            // Log detailed reason for not triggering
            const rejectionReasons = [];
            if (toolArgs.confidence !== 'high') rejectionReasons.push(`confidence=${toolArgs.confidence}`);
            if (!hasExplicitFarewell && !meetsStandardExchanges) {
              rejectionReasons.push(`only ${userMessageCount} exchanges (need 3+ without farewell)`);
            }
            if (hasExplicitFarewell && !meetsMinimumExchanges) {
              rejectionReasons.push(`no exchanges yet`);
            }
            if (!hasPositiveSentiment) rejectionReasons.push(`negative sentiment: ${sentiment}`);
            if (hasPendingQuestions) rejectionReasons.push('has pending questions');
            if (hasNegativePattern) rejectionReasons.push(`negative pattern in signal: "${userSignal}"`);
            if (!hasExplicitFarewell && userMessageCount < 3) {
              rejectionReasons.push(`no explicit farewell detected in: "${userSignal}"`);
            }
            
            console.log('Completion not triggered:', {
              confidence: toolArgs.confidence,
              rejectionReasons,
              userSignal,
              sentiment,
              userMessageCount,
              hasExplicitFarewell,
            });
          }
          // Don't add to toolResults - this is a client-side only tool
          continue;
        }
        
        // Handle built-in booking tools
        if (toolName === 'search_properties') {
          // PHASE 3: Check for cached result before executing
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 10);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached search_properties result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            
            // Restore shown properties from cached result if present
            if (cachedResult.success && cachedResult.result?.shownProperties?.length > 0) {
              storedShownProperties = cachedResult.result.shownProperties;
            }
            
            const { shownProperties, ...resultForAI } = cachedResult.result || {};
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(resultForAI || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await searchProperties(supabase, agentId, toolArgs);
          toolsUsed.push({ name: toolName, success: result.success });
          
          // Store shown properties for later metadata update (don't update now, will be overwritten)
          if (result.success && result.result?.shownProperties?.length > 0) {
            storedShownProperties = result.result.shownProperties;
            console.log(`Will store ${storedShownProperties.length} shown properties in final metadata update`);
          }
          
          // Remove shownProperties from the result sent to AI (it's for metadata only)
          const { shownProperties, ...resultForAI } = result.result || {};
          const resultContent = JSON.stringify(resultForAI || { error: result.error });
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultForAI || { error: result.error }, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: resultContent,
          });
          continue;
        }
        
        if (toolName === 'lookup_property') {
          // PHASE 3: Check for cached result before executing
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 10);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached lookup_property result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(cachedResult.result || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await lookupProperty(supabase, agentId, activeConversationId, toolArgs);
          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.result || { error: result.error };
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
          continue;
        }
        
        if (toolName === 'get_locations') {
          // PHASE 3: Check for cached result before executing
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 10);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached get_locations result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(cachedResult.result || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await getLocations(supabase, agentId);
          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.result || { error: result.error };
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
          continue;
        }
        
        if (toolName === 'check_calendar_availability') {
          // PHASE 3: Check for cached result (shorter window - 5 mins for time-sensitive data)
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 5);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached check_calendar_availability result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(cachedResult.result || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await checkCalendarAvailability(supabaseUrl, toolArgs);
          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.result || { error: result.error };
          
          // Store for booking UI transformation
          if (result.success && result.result) {
            lastCalendarResult = result.result;
          }
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
          continue;
        }
        
        if (toolName === 'book_appointment') {
          // NOTE: Never cache book_appointment - each booking is unique and must execute
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await bookAppointment(supabaseUrl, activeConversationId, conversationMetadata, toolArgs);
          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.result || { error: result.error };
          
          // Store for booking UI transformation
          if (result.success && result.result) {
            lastBookingResult = result.result;
          }
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
          continue;
        }

        // Find the user-defined tool configuration
        const tool = enabledTools.find(t => t.name === toolName);
        
        if (tool && tool.endpoint_url) {
          // PHASE 3: Check for cached result for user-defined tools
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 10);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached ${toolName} result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(cachedResult.result || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database (skip for preview mode)
          if (!previewMode) {
            await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          }
          
          const result = await callToolEndpoint({
            name: tool.name,
            endpoint_url: tool.endpoint_url,
            headers: tool.headers || {},
            timeout_ms: tool.timeout_ms || 10000,
          }, toolArgs);

          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.success ? result.result : { error: result.error };
          
          // PHASE 1: Persist tool result to database (skip for preview mode)
          if (!previewMode) {
            await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          }

          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
        } else {
          console.error(`Tool ${toolName} not found or has no endpoint`);
          const errorResult = { error: `Tool ${toolName} is not configured` };
          
          // PHASE 1: Persist even failed tool calls for debugging (skip for preview mode)
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
      
      // PHASE 3: Log redundancy stats
      if (redundantCallsSkipped > 0) {
        console.log(`PHASE 3: Skipped ${redundantCallsSkipped} redundant tool call(s) using cached results`);
      }

      // If AI only provided quick replies or marked complete without content, force a follow-up call to get actual response
      const needsContentFollowUp = !assistantContent && (quickReplies.length > 0 || aiMarkedComplete) && toolResults.length === 0;
      
      // Call AI again if there were actual tool results OR if we need content
      if (toolResults.length > 0 || needsContentFollowUp) {
        // Call AI again with tool results (or to get content if only quick replies were provided)
        const followUpMessages = needsContentFollowUp 
          ? aiRequestBody.messages // Just use original messages if we only need content
          : [
              ...aiRequestBody.messages,
              assistantMessage,
              ...toolResults,
            ];

        console.log(needsContentFollowUp 
          ? 'AI only provided quick replies/completion signal, making follow-up call for content'
          : 'Calling AI with tool results for final response');

        const followUpResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://getpilot.io',
            'X-Title': 'Pilot',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...aiRequestBody,
            messages: followUpMessages,
            tools: undefined, // Don't pass tools again
            tool_choice: undefined,
          }),
        });

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          assistantContent = followUpData.choices?.[0]?.message?.content || assistantContent || 'I apologize, but I was unable to generate a response.';
        } else {
          console.error('Follow-up AI call failed:', await followUpResponse.text());
          assistantContent = assistantContent || 'I apologize, but I encountered an error processing the tool results.';
        }
      }
    }

    // Fallback if no content
    if (!assistantContent) {
      assistantContent = 'I apologize, but I was unable to generate a response.';
    }

    // POST-GENERATION CONTENT MODERATION: Check AI response before delivery
    const outputModeration = await moderateContent(assistantContent);
    if (outputModeration.action === 'block') {
      console.warn(`[${requestId}] AI output blocked: Flagged for ${outputModeration.categories.join(', ')}`);
      // Log security event
      supabase.from('security_logs').insert({
        action: 'ai_output_blocked',
        resource_type: 'conversation',
        resource_id: activeConversationId,
        success: true,
        details: { 
          type: 'ai_response',
          categories: outputModeration.categories,
          severity: outputModeration.severity,
          request_id: requestId,
          agent_id: agentId,
        },
      }).then(() => {
        console.log(`[${requestId}] Security event logged: ai_output_blocked`);
      }).catch(err => {
        console.error(`[${requestId}] Failed to log security event:`, err);
      });
      
      // Replace with safe fallback response
      assistantContent = "I apologize, but I wasn't able to generate an appropriate response. How else can I help you?";
    } else if (outputModeration.action === 'warn') {
      console.warn(`[${requestId}] AI output warning: Flagged for ${outputModeration.categories.join(', ')}`);
      supabase.from('security_logs').insert({
        action: 'ai_output_warning',
        resource_type: 'conversation',
        resource_id: activeConversationId,
        success: true,
        details: { 
          type: 'ai_response',
          categories: outputModeration.categories,
          severity: outputModeration.severity,
          request_id: requestId,
          agent_id: agentId,
        },
      }).catch(err => {
        console.error(`[${requestId}] Failed to log output warning:`, err);
      });
    }

    // SECURITY: Sanitize AI output to prevent accidental leakage of sensitive information
    const { sanitized, redactionsApplied } = sanitizeAiOutput(assistantContent);
    if (redactionsApplied > 0) {
      console.warn(`[${requestId}] Security: Redacted ${redactionsApplied} sensitive pattern(s) from AI response`);
      // Log security event for monitoring (include agent_id for traceability)
      supabase.from('security_logs').insert({
        action: 'ai_output_sanitized',
        resource_type: 'conversation',
        resource_id: activeConversationId,
        success: true,
        details: { 
          redactions_count: redactionsApplied, 
          request_id: requestId,
          agent_id: agentId,
        },
      }).then(() => {
        console.log(`[${requestId}] Security event logged: ai_output_sanitized`);
      }).catch(err => {
        console.error(`[${requestId}] Failed to log security event:`, err);
      });
    }
    assistantContent = sanitized;

    // Add natural typing delay before responding (2-3 seconds, varied for realism)
    const minDelay = 2000; // 2 seconds
    const maxDelay = 3000; // 3 seconds
    const typingDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    console.log(`Adding natural typing delay: ${typingDelay}ms`);
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // COST OPTIMIZATION: Cache responses with moderate+ similarity (AGGRESSIVE - lowered from 0.92, removed sources requirement)
    if (queryHash && maxSimilarity > 0.65) {
      console.log(`Caching response with similarity ${maxSimilarity.toFixed(2)} for future reuse`);
      cacheResponse(supabase, queryHash, agentId, assistantContent, maxSimilarity);
    }

    // Split response into chunks for staggered display
    const chunks = splitResponseIntoChunks(assistantContent);
    console.log(`Splitting response into ${chunks.length} chunks`);

    // Fetch link previews for the full response (will be attached to last chunk)
    const linkPreviews = await fetchLinkPreviews(assistantContent, supabaseUrl, supabaseKey);
    console.log(`Cached ${linkPreviews.length} link previews for assistant message`);

    // Save each chunk as a separate message with offset timestamps (skip for preview mode)
    const assistantMessageIds: string[] = [];
    if (!previewMode) {
      for (let i = 0; i < chunks.length; i++) {
        const chunkTimestamp = new Date(Date.now() + (i * 100)); // 100ms offset for ordering
        const isLastChunk = i === chunks.length - 1;
        
        const { data: msg, error: msgError } = await supabase.from('messages').insert({
          conversation_id: activeConversationId,
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
          }
        }).select('id').single();
        
        if (msgError) {
          console.error(`Error saving chunk ${i}:`, msgError);
        }
        if (msg) assistantMessageIds.push(msg.id);
      }
    }

    const assistantMessageId = assistantMessageIds[assistantMessageIds.length - 1];

    // Update conversation metadata (skip for preview mode)
    if (!previewMode) {
      const currentMetadata = conversation?.metadata || {};
      
      // Merge page visits (keep existing ones, add new ones)
      let mergedPageVisits = currentMetadata.visited_pages || [];
      if (pageVisits && Array.isArray(pageVisits)) {
        // Only add page visits that aren't already tracked
        const existingUrls = new Set(mergedPageVisits.map((v: any) => `${v.url}-${v.entered_at}`));
        const newVisits = pageVisits.filter((v: any) => !existingUrls.has(`${v.url}-${v.entered_at}`));
        mergedPageVisits = [...mergedPageVisits, ...newVisits];
        console.log(`Merged ${newVisits.length} new page visits, total: ${mergedPageVisits.length}`);
      }
      
      // Language detection: detect language if not already detected
      // Only run on first few messages to avoid repeated detection
      let detectedLanguage: { code: string; name: string } | null = null;
      const existingLangCode = (currentMetadata as ConversationMetadata)?.detected_language_code;
      
      if (!existingLangCode) {
        // Collect user messages for detection
        const userMsgsForDetection = (messagesToSend || [])
          .filter((m: any) => m.role === 'user')
          .map((m: any) => m.content || '')
          .slice(-3); // Use last 3 user messages
        
        if (userMsgsForDetection.length > 0) {
          detectedLanguage = await detectConversationLanguage(userMsgsForDetection, OPENROUTER_API_KEY);
        }
      }
      
      await supabase
        .from('conversations')
        .update({
          metadata: {
            ...currentMetadata,
            messages_count: (currentMetadata.messages_count || 0) + 2, // user + assistant
            first_message_at: currentMetadata.first_message_at || new Date().toISOString(),
            visited_pages: mergedPageVisits,
            // Store last message preview for conversation list
            last_message_preview: assistantContent.substring(0, 60),
            last_message_role: 'assistant',
            last_message_at: new Date().toISOString(),
            // Track when the visitor/user last sent a message (for unread badge logic)
            last_user_message_at: new Date().toISOString(),
            // Preserve shown_properties: use new ones from this request, or keep existing
            shown_properties: storedShownProperties?.length 
              ? storedShownProperties 
              : currentMetadata.shown_properties,
            // Update timestamp only if we have new properties
            ...(storedShownProperties?.length && {
              last_property_search_at: new Date().toISOString(),
            }),
            // Language detection: save detected language for translation banner
            ...(detectedLanguage && {
              detected_language_code: detectedLanguage.code,
              detected_language: detectedLanguage.name,
            }),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeConversationId);

      // Track API call and message usage (fire and forget - don't wait)
      // +2 messages: 1 user message + 1 assistant response
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      supabase
        .from('usage_metrics')
        .upsert({
          user_id: agent.user_id,
          period_start: firstDayOfMonth.toISOString(),
          period_end: lastDayOfMonth.toISOString(),
          api_calls_count: currentApiCalls + 1,
          messages_count: currentMessagesCount + 2,
        }, {
          onConflict: 'user_id,period_start',
        })
        .then(() => console.log('API and message usage tracked'))
        .catch(err => console.error('Failed to track usage:', err));

      // PHASE 4: Extract and store semantic memories (fire and forget - don't block response)
      // Only extract from substantive conversations, not greetings
      if (!isGreetingRequest && messages && messages.length > 0) {
        const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop();
        if (lastUserMsg?.content && assistantContent) {
          const leadId = conversationMetadata?.lead_id as string | undefined;
          extractAndStoreMemories(
            supabase,
            agentId,
            leadId || null,
            activeConversationId,
            lastUserMsg.content,
            assistantContent,
            OPENROUTER_API_KEY
          ).catch(err => console.error('Memory extraction error:', err));
        }
      }
    }

    // Calculate final timing
    const totalDuration = performance.now() - startTime;
    
    // Log request completion with timing breakdown
    log.info('Request completed', {
      conversationId: activeConversationId,
      durationMs: Math.round(totalDuration),
      model: selectedModel,
      tier: modelTier,
      chunksCount: chunks.length,
      hasToolsUsed: toolsUsed.length > 0,
      hasLinkPreviews: linkPreviews.length > 0,
    });

    // Build booking UI component data from tracked tool results
    let dayPicker: DayPickerData | undefined;
    let timePicker: TimePickerData | undefined;
    let bookingConfirmed: BookingConfirmationData | undefined;

    // Check if we have calendar availability results to transform
    if (lastCalendarResult?.available_slots?.length > 0) {
      // Detect if user already selected a day from message context
      const userSelectedDate = detectSelectedDateFromMessages(messagesToSend);
      
      if (userSelectedDate) {
        // User mentioned a specific date - show time picker for that date
        timePicker = transformToTimePickerData(lastCalendarResult, userSelectedDate) || undefined;
        // If no times for that date, fall back to day picker
        if (!timePicker) {
          dayPicker = transformToDayPickerData(lastCalendarResult) || undefined;
        }
      } else {
        // No specific date mentioned - show day picker
        dayPicker = transformToDayPickerData(lastCalendarResult) || undefined;
      }
    }

    // Check if we have a booking confirmation to transform
    if (lastBookingResult?.booking) {
      bookingConfirmed = transformToBookingConfirmedData(lastBookingResult) || undefined;
    }

    // Return the response with chunked messages for staggered display
    return new Response(
      JSON.stringify({
        conversationId: previewMode ? null : activeConversationId, // No conversationId for preview mode
        requestId, // Include for client-side correlation
        // New: array of message chunks for staggered display
        messages: chunks.map((content, i) => ({
          id: previewMode ? `preview-${i}` : assistantMessageIds[i],
          content,
          chunkIndex: i,
        })),
        // Legacy: keep single response for backward compatibility
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
              numbers: callActionsResult.map(a => a.displayNumber) 
            });
          }
          return callActionsResult.length > 0 ? callActionsResult : undefined;
        })(),
        // Booking UI components
        dayPicker,
        timePicker,
        bookingConfirmed,
        aiMarkedComplete, // Signal to widget to show rating prompt
        durationMs: Math.round(totalDuration),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
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
