/**
 * Context Builder Module
 * 
 * Handles RAG search, embedding generation, and system prompt construction.
 * Extracted from widget-chat main handler for modularity.
 * 
 * @module _shared/handlers/context
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import type { ConversationMetadata, ShownProperty } from "../types.ts";
import { 
  generateEmbedding, 
  getCachedEmbedding, 
  cacheQueryEmbedding 
} from "../ai/embeddings.ts";
import { 
  searchKnowledge, 
  getCachedResponse, 
  cacheResponse 
} from "../ai/rag.ts";
import { 
  searchSemanticMemories, 
  formatMemoriesForPrompt,
  type SemanticMemory 
} from "../memory/semantic-memory.ts";
import { 
  RESPONSE_FORMATTING_RULES,
  MAX_RAG_CHUNKS 
} from "../ai/config.ts";
import { SECURITY_GUARDRAILS } from "../security/guardrails.ts";
import { normalizeQuery, hashQuery } from "../utils/hashing.ts";
import { corsHeaders } from "../cors.ts";

/** Result of RAG and context building */
export interface ContextResult {
  systemPrompt: string;
  sources: Array<{ source: string; type: string; similarity: number; url?: string }>;
  queryHash: string | null;
  maxSimilarity: number;
  retrievedMemories: SemanticMemory[];
  queryEmbeddingForMemory: number[] | null;
  cachedResponse: Response | null;
}

/**
 * Performs RAG search and builds the system prompt with all context.
 */
export async function buildContext(
  supabase: ReturnType<typeof createClient>,
  options: {
    agentId: string;
    baseSystemPrompt: string;
    messages: any[];
    isGreetingRequest: boolean;
    previewMode: boolean;
    conversationMetadata: ConversationMetadata | null;
    activeConversationId: string;
    hasLocations: boolean;
  }
): Promise<ContextResult> {
  const {
    agentId,
    baseSystemPrompt,
    messages,
    isGreetingRequest,
    previewMode,
    conversationMetadata,
    activeConversationId,
    hasLocations,
  } = options;

  let systemPrompt = baseSystemPrompt;
  let sources: Array<{ source: string; type: string; similarity: number; url?: string }> = [];
  let queryHash: string | null = null;
  let maxSimilarity = 0;
  let retrievedMemories: SemanticMemory[] = [];
  let queryEmbeddingForMemory: number[] | null = null;

  // Skip RAG for greeting requests
  if (!messages || messages.length === 0 || isGreetingRequest) {
    return buildFinalPrompt({
      systemPrompt,
      sources,
      queryHash,
      maxSimilarity,
      retrievedMemories,
      queryEmbeddingForMemory,
      conversationMetadata,
      hasLocations,
    });
  }

  // Get the last user message for RAG search
  const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();

  if (!lastUserMessage?.content) {
    return buildFinalPrompt({
      systemPrompt,
      sources,
      queryHash,
      maxSimilarity,
      retrievedMemories,
      queryEmbeddingForMemory,
      conversationMetadata,
      hasLocations,
    });
  }

  try {
    const queryContent = lastUserMessage.content;
    const normalizedQuery = normalizeQuery(queryContent);
    queryHash = await hashQuery(normalizedQuery + ':' + agentId);

    console.log('Query normalized for cache lookup:', normalizedQuery.substring(0, 50));

    // Check response cache first (skip for preview mode)
    if (!previewMode) {
      const cachedResponse = await getCachedResponse(supabase, queryHash, agentId);
      if (cachedResponse && cachedResponse.similarity > 0.70) {
        console.log('CACHE HIT: Returning cached response');
        return {
          systemPrompt,
          sources,
          queryHash,
          maxSimilarity: cachedResponse.similarity,
          retrievedMemories,
          queryEmbeddingForMemory,
          cachedResponse: new Response(
            JSON.stringify({
              conversationId: previewMode ? null : activeConversationId,
              response: cachedResponse.content,
              cached: true,
              similarity: cachedResponse.similarity,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          ),
        };
      }
    }

    // Check embedding cache or generate new embedding
    let queryEmbedding = await getCachedEmbedding(supabase, queryHash, agentId);

    if (queryEmbedding) {
      console.log('Embedding CACHE HIT - saved 1 embedding API call');
    } else {
      console.log('Generating new embedding for query:', queryContent.substring(0, 100));
      queryEmbedding = await generateEmbedding(queryContent);
      cacheQueryEmbedding(supabase, queryHash, normalizedQuery, queryEmbedding, agentId);
    }

    queryEmbeddingForMemory = queryEmbedding;

    // Dynamic RAG threshold based on query length
    const queryLength = queryContent.split(' ').length;
    const matchThreshold = queryLength < 5 ? 0.50 : queryLength < 15 ? 0.45 : 0.40;
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

    // Search for semantic memories
    const leadId = conversationMetadata?.lead_id;
    const semanticMemories = await searchSemanticMemories(
      supabase,
      agentId,
      leadId || null,
      activeConversationId || null,
      queryEmbedding,
      0.6,
      5
    );

    if (semanticMemories.length > 0) {
      console.log(`Found ${semanticMemories.length} relevant semantic memories`);
      retrievedMemories = semanticMemories;
    }

    // Inject knowledge context into system prompt
    if (knowledgeResults && knowledgeResults.length > 0) {
      maxSimilarity = Math.max(...knowledgeResults.map((r: any) => r.similarity));

      sources = knowledgeResults.map((result: any) => ({
        source: result.source,
        type: result.type,
        similarity: result.similarity,
        url: result.sourceUrl,
      }));

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

        systemPrompt = `${baseSystemPrompt}

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
    console.error('RAG error (continuing without knowledge):', ragError);
  }

  return buildFinalPrompt({
    systemPrompt,
    sources,
    queryHash,
    maxSimilarity,
    retrievedMemories,
    queryEmbeddingForMemory,
    conversationMetadata,
    hasLocations,
  });
}

/**
 * Builds the final system prompt with all context sections.
 */
function buildFinalPrompt(options: {
  systemPrompt: string;
  sources: Array<{ source: string; type: string; similarity: number; url?: string }>;
  queryHash: string | null;
  maxSimilarity: number;
  retrievedMemories: SemanticMemory[];
  queryEmbeddingForMemory: number[] | null;
  conversationMetadata: ConversationMetadata | null;
  hasLocations: boolean;
}): ContextResult {
  let { systemPrompt } = options;
  const {
    sources,
    queryHash,
    maxSimilarity,
    retrievedMemories,
    queryEmbeddingForMemory,
    conversationMetadata,
    hasLocations,
  } = options;

  // Add user context section
  systemPrompt = appendUserContext(systemPrompt, conversationMetadata);

  // Inject semantic memories
  if (retrievedMemories.length > 0) {
    const memoriesContext = formatMemoriesForPrompt(retrievedMemories);
    if (memoriesContext) {
      systemPrompt += `

REMEMBERED CONTEXT (from previous conversations):
${memoriesContext}

Use this remembered information naturally when relevant. Don't explicitly say "I remember you said..." unless it's conversationally appropriate.`;
      console.log(`Injected ${retrievedMemories.length} memories into system prompt`);
    }
  }

  // Add formatting rules
  systemPrompt += RESPONSE_FORMATTING_RULES;

  // Add security guardrails
  systemPrompt += SECURITY_GUARDRAILS;

  // Add language matching instruction
  systemPrompt += `

LANGUAGE: Always respond in the same language the user is writing in. If they write in Spanish, respond in Spanish. If they write in Portuguese, respond in Portuguese. Match their language naturally without mentioning that you're doing so.`;

  // Add property tools instructions if agent has locations
  if (hasLocations) {
    systemPrompt = appendPropertyToolsContext(systemPrompt, conversationMetadata);
  }

  return {
    systemPrompt,
    sources,
    queryHash,
    maxSimilarity,
    retrievedMemories,
    queryEmbeddingForMemory,
    cachedResponse: null,
  };
}

/**
 * Appends user context from conversation metadata to system prompt.
 */
function appendUserContext(
  systemPrompt: string,
  conversationMetadata: ConversationMetadata | null
): string {
  if (!conversationMetadata) return systemPrompt;

  // Detect initial message from custom fields
  let initialUserMessage: string | null = null;
  const messageFieldPatterns = /message|question|help|inquiry|reason|about|need|looking for|interest|details|describe|explain|issue|problem|request|comment/i;
  const processedCustomFields: Record<string, string> = {};

  if (conversationMetadata.custom_fields) {
    for (const [label, value] of Object.entries(conversationMetadata.custom_fields)) {
      if (value && typeof value === 'string' && value.trim()) {
        const isMessageField = messageFieldPatterns.test(label) && value.length > 20;
        if (isMessageField && !initialUserMessage) {
          initialUserMessage = value;
          console.log(`Detected initial user message from field "${label}": "${value.substring(0, 50)}..."`);
        } else {
          processedCustomFields[label] = value;
        }
      }
    }
  }

  const hasUserName = conversationMetadata.lead_name;
  const hasCustomFields = Object.keys(processedCustomFields).length > 0;

  if (!hasUserName && !hasCustomFields && !initialUserMessage) {
    return systemPrompt;
  }

  let userContextSection = `

USER INFORMATION (from contact form):`;

  if (conversationMetadata.lead_name) {
    userContextSection += `\n- Name: ${conversationMetadata.lead_name}`;
  }
  if (conversationMetadata.lead_email) {
    userContextSection += `\n- Email: ${conversationMetadata.lead_email}`;
  }

  const location = conversationMetadata.city && conversationMetadata.country
    ? `${conversationMetadata.city}, ${conversationMetadata.country}`
    : conversationMetadata.country || null;
  if (location) {
    userContextSection += `\n- Location: ${location}`;
  }

  for (const [label, value] of Object.entries(processedCustomFields)) {
    userContextSection += `\n- ${label}: ${value}`;
  }

  userContextSection += `

Use this information to personalize your responses when appropriate (e.g., address them by name, reference their company or interests). Be natural about it - don't force personalization if it doesn't fit the conversation.`;

  if (initialUserMessage) {
    userContextSection += `

INITIAL USER INQUIRY (from contact form):
"${initialUserMessage}"

This is what the user wanted to discuss when they started the chat. Treat this as their first question - address it directly in your response. Do NOT ask "how can I help?" when they've already told you what they need.`;
  }

  console.log('Added user context to system prompt', { hasInitialMessage: !!initialUserMessage });

  return systemPrompt + userContextSection;
}

/**
 * Appends property tools context with shown properties.
 */
function appendPropertyToolsContext(
  systemPrompt: string,
  conversationMetadata: ConversationMetadata | null
): string {
  const shownProperties = conversationMetadata?.shown_properties as ShownProperty[] | undefined;
  let shownPropertiesContext = '';

  if (shownProperties && shownProperties.length > 0) {
    shownPropertiesContext = `

RECENTLY SHOWN PROPERTIES (use these for booking/reference):
${shownProperties
  .map(
    (p) =>
      `${p.index}. ${p.address}, ${p.city}, ${p.state} - ${p.beds || '?'}bed/${p.baths || '?'}bath ${p.price_formatted} (ID: ${p.id})${p.community ? ` [${p.community}]` : ''}${p.location_id ? ` (Location: ${p.location_id})` : ''}`
  )
  .join('\n')}

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

  return (
    systemPrompt +
    `

PROPERTY & BOOKING TOOLS AVAILABLE:
You have access to real-time tools for properties, locations, and bookings. Each tool's description contains:
• TRIGGERS: When to use it
• EXAMPLES: Sample queries
• WORKFLOW: How it fits with other tools
• DO NOT USE: When to avoid it

Read each tool's description carefully to understand when and how to use it.
DO NOT rely solely on knowledge base context - use the tools for live data.${shownPropertiesContext}`
  );
}
