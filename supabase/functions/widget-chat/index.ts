import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Local type for conversation metadata (edge functions can't import from src/)
interface ConversationMetadata {
  lead_name?: string;
  lead_email?: string;
  custom_fields?: Record<string, string | number | boolean>;
  country?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  landing_page?: string;
  visited_pages?: string[];
  session_id?: string;
  ip_address?: string;
  last_message_at?: string;
  last_message_role?: string;
  last_user_message_at?: string;
  admin_last_read_at?: string;
  lead_id?: string;
}

// URL regex for extracting links from content
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// Simple SHA-256 hash function for API key validation
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fetch link previews for URLs in content (max 3)
async function fetchLinkPreviews(content: string, supabaseUrl: string, supabaseKey: string): Promise<any[]> {
  const urls = Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 3);
  if (urls.length === 0) return [];
  
  console.log(`Fetching link previews for ${urls.length} URLs`);
  
  const previews = await Promise.all(
    urls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/fetch-link-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`Failed to fetch preview for ${url}: ${response.status}`);
          return null;
        }
        
        const data = await response.json();
        // Only include valid previews (has title or is video)
        if (data && (data.title || data.videoType)) {
          return data;
        }
        return null;
      } catch (error) {
        console.error(`Error fetching preview for ${url}:`, error.message);
        return null;
      }
    })
  );
  
  return previews.filter(p => p !== null);
}

// OpenAI embedding model - compatible with stored embeddings (1536 dimensions)
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// Normalize query for cache lookup (lowercase, trim, remove extra whitespace)
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
}

// Hash query for cache key
async function hashQuery(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(query);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check query embedding cache
async function getCachedEmbedding(supabase: any, queryHash: string, agentId: string): Promise<number[] | null> {
  const { data, error } = await supabase
    .from('query_embedding_cache')
    .select('embedding')
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .single();
  
  if (error || !data?.embedding) return null;
  
  // Update hit count and last used
  supabase
    .from('query_embedding_cache')
    .update({ hit_count: supabase.rpc('increment', { x: 1 }), last_used_at: new Date().toISOString() })
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .then(() => {})
    .catch(() => {});
  
  // Parse embedding string to array
  try {
    const embeddingStr = data.embedding as string;
    const matches = embeddingStr.match(/[\d.-]+/g);
    return matches ? matches.map(Number) : null;
  } catch {
    return null;
  }
}

// Cache query embedding
async function cacheQueryEmbedding(supabase: any, queryHash: string, normalized: string, embedding: number[], agentId: string): Promise<void> {
  try {
    const embeddingVector = `[${embedding.join(',')}]`;
    const { error } = await supabase
      .from('query_embedding_cache')
      .upsert({
        query_hash: queryHash,
        query_normalized: normalized,
        embedding: embeddingVector,
        agent_id: agentId,
      }, { onConflict: 'query_hash' });
    
    if (error) {
      console.error('Failed to cache embedding:', error);
    }
  } catch (err) {
    console.error('Failed to cache embedding:', err);
  }
}

// Check response cache for high-confidence cached responses
async function getCachedResponse(supabase: any, queryHash: string, agentId: string): Promise<{ content: string; similarity: number } | null> {
  const { data, error } = await supabase
    .from('response_cache')
    .select('response_content, similarity_score')
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) return null;
  
  // Update hit count
  supabase
    .from('response_cache')
    .update({ hit_count: supabase.rpc('increment', { x: 1 }), last_used_at: new Date().toISOString() })
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .then(() => {})
    .catch(() => {});
  
  console.log('Cache HIT for response, similarity:', data.similarity_score);
  return { content: data.response_content, similarity: data.similarity_score };
}

// Cache high-confidence response
async function cacheResponse(supabase: any, queryHash: string, agentId: string, content: string, similarity: number): Promise<void> {
  try {
    // Only cache responses with very high similarity (FAQ-style)
    if (similarity < 0.92) return;
    
    const { error } = await supabase
      .from('response_cache')
      .upsert({
        query_hash: queryHash,
        agent_id: agentId,
        response_content: content,
        similarity_score: similarity,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }, { onConflict: 'query_hash,agent_id' });
    
    if (error) {
      console.error('Failed to cache response:', error);
    }
  } catch (err) {
    console.error('Failed to cache response:', err);
  }
}

// Generate embedding for a query using OpenAI (matches stored embeddings)
async function generateEmbedding(query: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: query,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Embedding generation error:', error);
    throw new Error('Failed to generate embedding');
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Search for relevant knowledge chunks (with fallback to legacy document search)
async function searchKnowledge(
  supabase: any,
  agentId: string,
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<{ content: string; source: string; type: string; similarity: number; chunkIndex?: number; sourceUrl?: string }[]> {
  const embeddingVector = `[${queryEmbedding.join(',')}]`;
  const results: { content: string; source: string; type: string; similarity: number; chunkIndex?: number; sourceUrl?: string }[] = [];

  // Try new chunk-level search first
  const { data: chunkData, error: chunkError } = await supabase.rpc('search_knowledge_chunks', {
    p_agent_id: agentId,
    p_query_embedding: embeddingVector,
    p_match_threshold: matchThreshold,
    p_match_count: matchCount,
  });

  if (!chunkError && chunkData && chunkData.length > 0) {
    console.log(`Found ${chunkData.length} relevant chunks via chunk-level search`);
    
    // Get source URLs for the chunks
    const sourceIds = [...new Set(chunkData.map((c: any) => c.source_id))];
    const { data: sourceData } = await supabase
      .from('knowledge_sources')
      .select('id, source, type')
      .in('id', sourceIds);
    
    const sourceMap = new Map(sourceData?.map((s: any) => [s.id, s]) || []);
    
    results.push(...chunkData.map((chunk: any) => {
      const sourceInfo = sourceMap.get(chunk.source_id);
      // Include the source URL for URL-type sources
      const sourceUrl = sourceInfo?.type === 'url' ? sourceInfo.source : undefined;
      return {
        content: chunk.content,
        source: chunk.source_name,
        type: chunk.source_type,
        similarity: chunk.similarity,
        chunkIndex: chunk.chunk_index,
        sourceUrl,
      };
    }));
  } else {
    // Fallback to legacy document-level search for backwards compatibility
    console.log('Falling back to document-level search');
    const { data, error } = await supabase.rpc('search_knowledge_sources', {
      p_agent_id: agentId,
      p_query_embedding: embeddingVector,
      p_match_threshold: matchThreshold,
      p_match_count: matchCount,
    });

    if (!error && data) {
      results.push(...data.map((d: any) => ({
        content: d.content,
        source: d.source,
        type: d.type,
        similarity: d.similarity,
        // For URL sources, the source IS the URL
        sourceUrl: d.type === 'url' ? d.source : undefined,
      })));
    }
  }

  // Also search Help Articles for RAG
  try {
    console.log(`Searching help articles with threshold: ${matchThreshold}`);
    const { data: helpArticles, error: helpError } = await supabase.rpc('search_help_articles', {
      p_agent_id: agentId,
      p_query_embedding: embeddingVector,
      p_match_threshold: matchThreshold,
      p_match_count: 3, // Limit help articles to top 3
    });

    if (helpError) {
      console.error('Help article search RPC error:', helpError);
    } else if (!helpArticles || helpArticles.length === 0) {
      console.log('No help articles found above threshold');
    } else {
      console.log(`Found ${helpArticles.length} relevant help articles:`, 
        helpArticles.map((a: any) => ({ title: a.title, similarity: a.similarity?.toFixed(3) })));
      results.push(...helpArticles.map((article: any) => ({
        content: article.content,
        source: `Help: ${article.title}${article.category_name ? ` (${article.category_name})` : ''}`,
        type: 'help_article',
        similarity: article.similarity,
        // Help articles don't have external URLs
      })));
    }
  } catch (helpSearchError) {
    console.error('Help article search error (continuing without):', helpSearchError);
  }

  // Sort combined results by similarity and return top matches
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, matchCount);
}

// Geo-IP lookup using ip-api.com (free, no API key needed)
async function getLocationFromIP(ip: string): Promise<{ country: string; city: string; countryCode: string; region: string }> {
  if (!ip || ip === 'unknown') {
    return { country: 'Unknown', city: '', countryCode: '', region: '' };
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city,regionName,status`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    const data = await response.json();
    if (data.status === 'success') {
      console.log(`Geo-IP lookup for ${ip}: ${data.city}, ${data.regionName}, ${data.country} (${data.countryCode})`);
      return { 
        country: data.country || 'Unknown', 
        city: data.city || '',
        countryCode: data.countryCode || '',
        region: data.regionName || '',
      };
    }
  } catch (error) {
    console.error('Geo-IP lookup failed:', error);
  }
  return { country: 'Unknown', city: '', countryCode: '', region: '' };
}

// Parse user agent string for device info
function parseUserAgent(userAgent: string | null): { device: string; browser: string; os: string } {
  if (!userAgent) return { device: 'unknown', browser: 'unknown', os: 'unknown' };
  
  let device = 'desktop';
  if (/mobile/i.test(userAgent)) device = 'mobile';
  else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';
  
  let browser = 'unknown';
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/edge/i.test(userAgent)) browser = 'Edge';
  
  let os = 'unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';
  
  return { device, browser, os };
}

// Check if request is from widget (has valid widget origin)
function isWidgetRequest(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  return !!(origin || referer);
}

// Call a tool endpoint with the provided arguments
async function callToolEndpoint(
  tool: { name: string; endpoint_url: string; headers: any; timeout_ms: number },
  args: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), tool.timeout_ms || 10000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(tool.headers || {}),
    };

    console.log(`Calling tool ${tool.name} at ${tool.endpoint_url} with args:`, args);

    const response = await fetch(tool.endpoint_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(args),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Tool ${tool.name} returned error:`, response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText.substring(0, 200)}` };
    }

    const result = await response.json();
    console.log(`Tool ${tool.name} returned:`, result);
    return { success: true, result };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Tool ${tool.name} timed out after ${tool.timeout_ms}ms`);
      return { success: false, error: 'Request timed out' };
    }
    console.error(`Tool ${tool.name} error:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, conversationId, messages, leadId, pageVisits, referrerJourney, visitorId } = await req.json();

    // Log incoming data for debugging
    console.log('Received widget-chat request:', {
      agentId,
      conversationId: conversationId || 'new',
      messagesCount: messages?.length || 0,
      pageVisitsCount: pageVisits?.length || 0,
      hasReferrerJourney: !!referrerJourney,
      referrerJourney: referrerJourney || null,
      visitorId: visitorId || null,
    });

    if (!agentId) {
      throw new Error('Agent ID is required');
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
      console.log('Request from widget origin - bypassing API key validation');
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Non-widget requests with API key - validate it
      const apiKey = authHeader.substring(7);
      
      // Hash the API key for comparison
      const keyHash = await hashApiKey(apiKey);
      
      // Validate API key and check rate limits
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_api_key', { p_key_hash: keyHash, p_agent_id: agentId });
      
      if (validationError) {
        console.error('API key validation error:', validationError);
        return new Response(
          JSON.stringify({ error: 'API key validation failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const validation = validationResult?.[0];
      
      if (!validation?.valid) {
        console.log('Invalid API key attempt for agent:', agentId);
        return new Response(
          JSON.stringify({ error: validation?.error_message || 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (validation.rate_limited) {
        console.log('Rate limited API key:', validation.key_id);
        return new Response(
          JSON.stringify({ error: validation.error_message || 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('API key authenticated successfully:', validation.key_id);
    } else {
      // No API key and not from widget - reject
      console.log('Rejected: No API key and not from widget origin');
      return new Response(
        JSON.stringify({ error: 'API key required. Include Authorization: Bearer <api_key> header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Format tools for OpenAI/Lovable AI API
    const formattedTools = enabledTools.length > 0 ? enabledTools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters || { type: 'object', properties: {} },
      }
    })) : undefined;

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

    // Create or get conversation
    let activeConversationId = conversationId;
    
    if (!activeConversationId || activeConversationId === 'new' || activeConversationId.startsWith('conv_') || activeConversationId.startsWith('migrated_')) {
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

    // Check conversation status (for human takeover)
    const { data: conversation } = await supabase
      .from('conversations')
      .select('status, metadata')
      .eq('id', activeConversationId)
      .single();

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

    // Check if this is a greeting request (special message to trigger AI greeting)
    const isGreetingRequest = messages && messages.length === 1 && 
      messages[0].role === 'user' && 
      messages[0].content === '__GREETING_REQUEST__';
    
    // Save the user message to database (skip for greeting requests)
    let userMessageId: string | undefined;
    if (messages && messages.length > 0 && !isGreetingRequest) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
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

    // Check plan limits - get subscription and limits
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
      .select('api_calls_count')
      .eq('user_id', agent.user_id)
      .gte('period_start', firstDayOfMonth.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentApiCalls = usageMetrics?.api_calls_count || 0;

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
          
          // COST OPTIMIZATION: Check response cache first for FAQ-style queries
          const cachedResponse = await getCachedResponse(supabase, queryHash, agentId);
          if (cachedResponse && cachedResponse.similarity > 0.92) {
            console.log('CACHE HIT: Returning cached response, skipping AI call entirely');
            
            // Save user message
            if (messages && messages.length > 0) {
              await supabase.from('messages').insert({
                conversation_id: activeConversationId,
                role: 'user',
                content: queryContent,
                metadata: { source: 'widget' }
              });
            }
            
            // Save cached response as assistant message
            await supabase.from('messages').insert({
              conversation_id: activeConversationId,
              role: 'assistant',
              content: cachedResponse.content,
              metadata: { source: 'cache', cache_similarity: cachedResponse.similarity }
            });
            
            return new Response(
              JSON.stringify({
                conversationId: activeConversationId,
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
          
          // RAG threshold tuned for OpenAI embeddings (industry standard: 0.40-0.50)
          // Higher thresholds (0.70+) cause most semantically relevant content to be missed
          const queryLength = queryContent.split(' ').length;
          const matchThreshold = queryLength < 5 ? 0.50 : queryLength < 15 ? 0.45 : 0.40;
          const matchCount = queryLength < 10 ? 5 : 7; // More context for better responses
          
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
1. When referencing information from sources, you can naturally cite them (e.g., "According to our documentation..." or "Based on our help article...").
2. **ALWAYS SHARE LINKS**: You MUST include the source URL in your response when using information from a source that has a URL. This is critical for user trust and verification. Format: "Learn more: [URL]" or include the link inline naturally. Users expect clickable links they can follow.
3. **NEVER reference a knowledge source without including its link** if one is available. Every piece of sourced information should have an accompanying link.
4. If multiple sources are relevant, include multiple links so users can explore all resources.`;
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
    
    // Check if we have meaningful user context to add
    const hasUserName = conversationMetadata.lead_name;
    const hasCustomFields = conversationMetadata.custom_fields && Object.keys(conversationMetadata.custom_fields).length > 0;
    
    if (hasUserName || hasCustomFields) {
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
      
      // Add custom fields from contact form
      if (conversationMetadata.custom_fields) {
        for (const [label, value] of Object.entries(conversationMetadata.custom_fields)) {
          if (value) {
            userContextSection += `\n- ${label}: ${value}`;
          }
        }
      }
      
      userContextSection += `

Use this information to personalize your responses when appropriate (e.g., address them by name, reference their company or interests). Be natural about it - don't force personalization if it doesn't fit the conversation.`;
      
      console.log('Added user context to system prompt');
    }

    // Append user context to system prompt
    if (userContextSection) {
      systemPrompt = systemPrompt + userContextSection;
    }

    // For greeting requests, add a special instruction and use empty messages
    let messagesToSend = messages;
    if (isGreetingRequest) {
      console.log('Handling greeting request - generating personalized welcome');
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

    // Build the initial AI request with all behavior settings
    const aiRequestBody: any = {
      model: agent.model || 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messagesToSend,
      ],
      stream: false, // Non-streaming for easier message persistence
      temperature: agent.temperature || 0.7,
      max_completion_tokens: agent.max_tokens || 2000,
      top_p: deploymentConfig.top_p || 1.0,
      presence_penalty: deploymentConfig.presence_penalty || 0,
      frequency_penalty: deploymentConfig.frequency_penalty || 0,
    };

    // Built-in quick replies tool (always available)
    const quickRepliesTool = {
      type: 'function',
      function: {
        name: 'suggest_quick_replies',
        description: 'Suggest 2-4 relevant follow-up questions or actions the user might want to take next. Use this after every response to help guide the conversation.',
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
    };

    // Combine built-in tools with user-defined tools
    const allTools = [quickRepliesTool, ...(formattedTools || [])];
    
    // Add tools to request
    aiRequestBody.tools = allTools;
    aiRequestBody.tool_choice = 'auto';

    // Call OpenRouter API
    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://chatpad.ai',
        'X-Title': 'ChatPad',
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

    // Handle tool calls if AI decided to use tools
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`AI requested ${assistantMessage.tool_calls.length} tool call(s)`);
      
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
        
        // Find the user-defined tool configuration
        const tool = enabledTools.find(t => t.name === toolName);
        
        if (tool && tool.endpoint_url) {
          const result = await callToolEndpoint({
            name: tool.name,
            endpoint_url: tool.endpoint_url,
            headers: tool.headers || {},
            timeout_ms: tool.timeout_ms || 10000,
          }, toolArgs);

          toolsUsed.push({ name: toolName, success: result.success });

          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result.success 
              ? JSON.stringify(result.result) 
              : JSON.stringify({ error: result.error }),
          });
        } else {
          console.error(`Tool ${toolName} not found or has no endpoint`);
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: `Tool ${toolName} is not configured` }),
          });
          toolsUsed.push({ name: toolName, success: false });
        }
      }

      // Only call AI again if there were actual tool results (not just quick replies)
      if (toolResults.length > 0) {
        // Call AI again with tool results
        const followUpMessages = [
          ...aiRequestBody.messages,
          assistantMessage,
          ...toolResults,
        ];

        console.log('Calling AI with tool results for final response');

        const followUpResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://chatpad.ai',
            'X-Title': 'ChatPad',
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

    // Add natural typing delay before responding (2-3 seconds, varied for realism)
    const minDelay = 2000; // 2 seconds
    const maxDelay = 3000; // 3 seconds
    const typingDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    console.log(`Adding natural typing delay: ${typingDelay}ms`);
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // COST OPTIMIZATION: Cache high-confidence responses for FAQ-style queries
    if (queryHash && maxSimilarity > 0.92 && sources.length > 0) {
      console.log(`Caching response with similarity ${maxSimilarity.toFixed(2)} for future reuse`);
      cacheResponse(supabase, queryHash, agentId, assistantContent, maxSimilarity);
    }

    // Fetch link previews for assistant message content (server-side caching)
    const linkPreviews = await fetchLinkPreviews(assistantContent, supabaseUrl, supabaseKey);
    console.log(`Cached ${linkPreviews.length} link previews for assistant message`);

    // Save the assistant message to database with cached link previews
    const { data: assistantMsg, error: assistantMsgError } = await supabase.from('messages').insert({
      conversation_id: activeConversationId,
      role: 'assistant',
      content: assistantContent,
      metadata: { 
        source: 'ai',
        model: agent.model,
        knowledge_sources: sources.length > 0 ? sources : undefined,
        tools_used: toolsUsed.length > 0 ? toolsUsed : undefined,
        link_previews: linkPreviews.length > 0 ? linkPreviews : undefined,
      }
    }).select('id').single();

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    const assistantMessageId = assistantMsg?.id;

    // Update conversation metadata (message count, last activity, page visits, last message preview)
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
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeConversationId);

    // Track API call usage (fire and forget - don't wait)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    supabase
      .from('usage_metrics')
      .upsert({
        user_id: agent.user_id,
        period_start: firstDayOfMonth.toISOString(),
        period_end: lastDayOfMonth.toISOString(),
        api_calls_count: currentApiCalls + 1,
      }, {
        onConflict: 'user_id,period_start',
      })
      .then(() => console.log('API usage tracked'))
      .catch(err => console.error('Failed to track usage:', err));

    // Return the response with conversation ID, message IDs, cached link previews, and quick replies
    return new Response(
      JSON.stringify({
        conversationId: activeConversationId,
        response: assistantContent,
        userMessageId,
        assistantMessageId,
        sources: sources.length > 0 ? sources : undefined,
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        linkPreviews: linkPreviews.length > 0 ? linkPreviews : undefined,
        quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Widget chat error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
