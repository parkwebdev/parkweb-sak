# Pilot AI Architecture

> **Last Updated**: January 2026  
> **Status**: Active  
> **Related**: [Edge Functions](./EDGE_FUNCTIONS.md), [Database Schema](./DATABASE_SCHEMA.md), [Widget Architecture](./WIDGET_ARCHITECTURE.md)

Complete documentation of how AI is used throughout the Pilot platform.

---

## Table of Contents

1. [Overview](#overview)
2. [AI Provider & Models](#ai-provider--models)
3. [Smart Model Routing](#smart-model-routing)
4. [RAG (Retrieval-Augmented Generation)](#rag-retrieval-augmented-generation)
5. [System Prompt Architecture](#system-prompt-architecture)
6. [Built-In AI Tools](#built-in-ai-tools)
7. [Response Caching](#response-caching)
8. [Context Window Optimization](#context-window-optimization)
9. [Edge Function Flow](#edge-function-flow)
10. [Special Behaviors](#special-behaviors)
11. [File References](#file-references)
12. [Key Metrics](#key-metrics)

---

## Overview

Pilot uses AI in three primary ways:

| Component | Purpose | Provider |
|-----------|---------|----------|
| **Chat AI** | Conversational responses in widget | OpenRouter |
| **Embeddings AI** | Vector embeddings for RAG search | OpenRouter |
| **Cost Optimization** | Smart routing, caching, context limits | Internal |

**Key Principle**: All AI operations flow through OpenRouter for consolidated billing and unified API access.

---

## AI Provider & Models

### Embedding Model

```
Model: qwen/qwen3-embedding-8b
Dimensions: 1024 (truncated from 4096 via MRL)
Cost: $0.01 per 1M tokens
```

### Chat Models (Tiered)

| Tier | Model | Cost (Input/Output per 1M) | Use Case |
|------|-------|---------------------------|----------|
| **Lite** | `google/gemini-2.5-flash-lite` | $0.015 / $0.06 | Simple FAQ lookups |
| **Standard** | `google/gemini-2.5-flash` | $0.15 / $0.60 | General queries |
| **Premium** | Agent's configured model | Varies | Complex reasoning |

---

## Smart Model Routing

The system automatically selects the most cost-effective model based on query characteristics.

### Routing Logic

```typescript
function selectModelTier(params) {
  const { ragSimilarity, wordCount, conversationLength, requiresTools, agentModel } = params;
  
  // TIER 1: Lite - Simple lookups with high RAG match
  // OPTIMIZED: Lowered threshold from 0.65 to 0.60 (Dec 2024)
  if (ragSimilarity > 0.60 && wordCount < 15 && !requiresTools && conversationLength < 5) {
    return { model: 'google/gemini-2.5-flash-lite', tier: 'lite' };
  }
  
  // TIER 3: Premium - Complex reasoning needed
  if (ragSimilarity < 0.35 || conversationLength > 10 || requiresTools) {
    return { model: agentModel, tier: 'premium' };
  }
  
  // TIER 2: Standard - Default balanced choice
  return { model: 'google/gemini-2.5-flash', tier: 'standard' };
}
```

### Routing Criteria

| Factor | Lite | Standard | Premium |
|--------|------|----------|---------|
| RAG Similarity | > 0.60 | 0.35 - 0.60 | < 0.35 |
| Query Words | < 15 | Any | Any |
| Conversation Length | < 5 messages | 5-10 messages | > 10 messages |
| Tools Required | No | No | Yes |

**Result**: ~75% of queries route to cheaper models, saving 45-65% on chat costs.

---

## RAG (Retrieval-Augmented Generation)

### Knowledge Processing Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │───▶│   Extract   │───▶│    Chunk    │───▶│    Embed    │
│  URL/PDF    │    │   Content   │    │   (~500     │    │   Qwen3     │
│             │    │             │    │   tokens)   │    │   1024-dim  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
                                                        ┌─────────────┐
                                                        │   Store in  │
                                                        │  knowledge  │
                                                        │   _chunks   │
                                                        └─────────────┘
```

### Vector Search at Query Time

```typescript
// 1. Embed user query
const queryEmbedding = await generateEmbedding(userMessage);

// 2. Search knowledge chunks
const chunks = await supabase.rpc('search_knowledge_chunks', {
  p_agent_id: agentId,
  p_query_embedding: queryEmbedding,
  p_match_threshold: getSimilarityThreshold(wordCount), // Dynamic threshold
  p_match_count: 3 // MAX_RAG_CHUNKS
});

// 3. Search help articles
const articles = await supabase.rpc('search_help_articles', {
  p_agent_id: agentId,
  p_query_embedding: queryEmbedding,
  p_match_threshold: 0.35,
  p_match_count: 3
});
```

### Dynamic Similarity Thresholds

| Query Length | Threshold | Rationale |
|--------------|-----------|-----------|
| < 5 words | 0.50 | Short queries need looser matching |
| 5-15 words | 0.45 | Medium queries |
| > 15 words | 0.40 | Longer queries can be more specific |

---

## System Prompt Architecture

The AI receives a layered system prompt built from multiple sources.

### Prompt Layers

```
┌────────────────────────────────────────────────────────────────┐
│ 1. AGENT'S CUSTOM SYSTEM PROMPT (user-editable)                │
│    "You are a helpful assistant for Acme Corp..."              │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. BASELINE PROMPT FRAMEWORK (non-editable, always appended)  │
│    - Response formatting rules                                  │
│    - Link sharing requirements                                  │
│    - Conciseness guidelines                                     │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. RAG CONTEXT (when knowledge sources match)                  │
│    - Relevant knowledge chunks                                  │
│    - Source attribution instructions                            │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. USER INFORMATION (when lead data available)                 │
│    - Name, email, company                                       │
│    - Personalization instructions                                │
└────────────────────────────────────────────────────────────────┘
```

### Baseline Prompt Framework (Non-Editable)

This is **always appended** to the agent's custom system prompt and cannot be modified by users:

```typescript
const RESPONSE_FORMATTING_RULES = `
## Response Formatting Rules (CRITICAL - ALWAYS FOLLOW)

### Message Chunking
- Use ||| delimiter to split responses into multiple message bubbles
- Each chunk should be 1-3 sentences max
- Use for: separate topics, step-by-step instructions, or emphasis
- Example: "Here's what I found|||The main issue is...|||To fix this:"
- MAX 4 chunks per response

### Conciseness
- Be EXTREMELY concise - 1-2 sentences for simple questions
- Max 4-5 sentences for complex questions
- Skip preambles like "I'd be happy to help" or "Great question"
- Get straight to the answer

### Link Formatting
- ALWAYS share source URLs when using knowledge sources
- Put links on their own line: "Learn more: [URL]"
- Links will automatically display as rich previews
- NEVER skip sharing the source link

### Bullet Points
- Use bullets for lists of 3+ items
- Keep bullets short (1 line each)
- Use - for bullets, not * or •
`;
```

### RAG Context Injection

When knowledge sources match, this section is added:

```typescript
const RAG_CONTEXT_SECTION = `
## Knowledge Base Context
Use the following information to answer the user's question. 
ALWAYS cite your sources by sharing the URL.

${chunks.map((c, i) => `
[Source ${i + 1}: ${c.source_name} | URL: ${c.source_url}]
${c.content}
`).join('\n')}

IMPORTANT: When using this information, ALWAYS include the source URL.
Format: "Learn more: [URL]"
`;
```

### User Information Injection

When lead data is available (contact form submitted):

```typescript
const USER_INFO_SECTION = `
## User Information
The following information is known about the user you're chatting with:
- Name: ${lead.name}
- Email: ${lead.email}
- Company: ${lead.company}
${customFields}

Use this information to personalize your responses naturally.
Address them by name when appropriate.
`;
```

---

## Built-In AI Tools

The AI has access to these tools (function calling):

### 1. suggest_quick_replies

Generates 2-4 follow-up suggestions after each response.

```typescript
{
  name: "suggest_quick_replies",
  description: "Generate 2-4 short follow-up suggestions",
  parameters: {
    type: "object",
    properties: {
      suggestions: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 4
      }
    }
  }
}
```

**Note**: Disabled for Tier 1 (lite) model to save costs.

### 2. mark_conversation_complete

Detects when conversation appears fully resolved.

```typescript
{
  name: "mark_conversation_complete",
  description: "Mark conversation as complete when user expresses satisfaction",
  parameters: {
    type: "object",
    properties: {
      reason: { type: "string" },
      confidence: { type: "number", minimum: 0, maximum: 1 }
    }
  }
}
```

**Trigger**: When confidence > 0.8, shows satisfaction rating prompt after 3-second delay.

### 3. Custom Tools (User-Defined)

Users can define custom tools that call external APIs:

```typescript
// Stored in agent_tools table
{
  name: "check_inventory",
  description: "Check product inventory levels",
  endpoint_url: "https://api.example.com/inventory",
  headers: { "Authorization": "Bearer {{API_KEY}}" },
  timeout_ms: 10000,
  parameters: {
    type: "object",
    properties: {
      product_id: { type: "string" }
    }
  }
}
```

---

## Response Caching

Aggressive caching reduces AI API calls by 30-50%.

### Cache Flow

```
┌─────────────┐    ┌─────────────────────────────────────────────────┐
│ User Query  │───▶│ Normalize query (lowercase, trim, remove punct) │
└─────────────┘    └─────────────────────────────────────────────────┘
                                      │
                                      ▼
                   ┌─────────────────────────────────────────────────┐
                   │ Generate hash: SHA-256(normalized_query)        │
                   └─────────────────────────────────────────────────┘
                                      │
                                      ▼
                   ┌─────────────────────────────────────────────────┐
                   │ Check response_cache for matching hash          │
                   │ with similarity > 0.70                          │
                   └─────────────────────────────────────────────────┘
                          │                              │
                    [CACHE HIT]                    [CACHE MISS]
                          │                              │
                          ▼                              ▼
                   ┌──────────────┐            ┌──────────────────┐
                   │ Return cached│            │ Generate new     │
                   │ response     │            │ AI response      │
                   └──────────────┘            └──────────────────┘
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │ If similarity    │
                                               │ > 0.65, cache    │
                                               │ for 30 days      │
                                               └──────────────────┘
```

### Cache Settings

| Setting | Value | Previous | Change |
|---------|-------|----------|--------|
| Storage Threshold | 0.60 | 0.65 | Lower = more caching |
| Hit Threshold | 0.70 | 0.92 | Lower = more cache hits |
| TTL | 30 days | 7 days | Longer retention |
| Query Embedding TTL | 7 days | None | Auto cleanup |
| Require Sources | No | Yes | Cache even without RAG |

### Query Embedding Cache

Query embeddings are also cached to avoid re-embedding identical queries:

```typescript
// Check query_embedding_cache first
const cached = await supabase
  .from('query_embedding_cache')
  .select('embedding')
  .eq('query_hash', queryHash)
  .single();

if (cached) {
  return cached.embedding; // Skip embedding API call
}
```

---

## Context Window Optimization

Limits applied to reduce input tokens by 20-30%.

### Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| `MAX_CONVERSATION_HISTORY` | 10 messages | Limits chat history sent to AI |
| `MAX_RAG_CHUNKS` | 3 chunks | Limits knowledge context |
| `MAX_RESPONSE_CHUNKS` | 4 chunks | Limits response splitting |

### Conversation History Truncation

```typescript
function truncateConversationHistory(messages, maxMessages = 10) {
  if (messages.length <= maxMessages) {
    return messages;
  }
  
  // Keep system message + last N messages
  const systemMessage = messages.find(m => m.role === 'system');
  const recentMessages = messages.slice(-maxMessages);
  
  return systemMessage 
    ? [systemMessage, ...recentMessages]
    : recentMessages;
}
```

---

## Edge Function Flow

Complete request lifecycle in `widget-chat`:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          WIDGET-CHAT EDGE FUNCTION                        │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATION                                                         │
│    - Validate API key (if not widget origin)                              │
│    - Check rate limits                                                    │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. LOAD CONTEXT                                                           │
│    - Fetch agent config (model, temperature, system prompt)               │
│    - Fetch/create conversation                                            │
│    - Load conversation history                                            │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. SPECIAL CASES                                                          │
│    - If __GREETING_REQUEST__: return greeting, skip AI                    │
│    - If human_takeover status: return "Agent will respond"                │
│    - If conversation closed: return friendly close message                │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 4. CACHE CHECK                                                            │
│    - Normalize query, generate hash                                       │
│    - Check response_cache for similar response                            │
│    - If hit (similarity > 0.70): return cached response                   │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 5. RAG RETRIEVAL                                                          │
│    - Generate query embedding (check cache first)                         │
│    - Search knowledge_chunks (top 3)                                      │
│    - Search help_articles (top 3)                                         │
│    - Calculate best RAG similarity score                                  │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 6. MODEL SELECTION                                                        │
│    - Evaluate: RAG similarity, word count, conversation length, tools    │
│    - Select tier: lite / standard / premium                               │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 7. BUILD SYSTEM PROMPT                                                    │
│    - Agent's custom prompt                                                │
│    - + Baseline formatting rules                                          │
│    - + RAG context (if matches found)                                     │
│    - + User info (if lead data available)                                 │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 8. AI COMPLETION                                                          │
│    - Call OpenRouter API (stream: false)                                  │
│    - Process tool calls if any                                            │
│    - Handle empty response with retry                                     │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 9. POST-PROCESSING                                                        │
│    - Split response by ||| delimiter                                      │
│    - Strip common preambles                                               │
│    - Fetch link previews for URLs                                         │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 10. PERSIST & RESPOND                                                     │
│    - Save messages to database                                            │
│    - Cache response (if similarity > 0.65)                                │
│    - Update conversation metadata                                         │
│    - Return response to widget                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Special Behaviors

### Greeting Request

When widget sends `__GREETING_REQUEST__`:

```typescript
if (message === '__GREETING_REQUEST__') {
  const greeting = agent.deployment_config?.greeting_message 
    || "Hi! How can I help you today?";
  
  // Save greeting as assistant message
  await saveMessage(conversationId, 'assistant', greeting);
  
  return { content: greeting, isGreeting: true };
}
```

### Human Takeover

When `conversation.status === 'human_takeover'`:

```typescript
if (conversation.status === 'human_takeover') {
  // Don't call AI, just save user message
  await saveMessage(conversationId, 'user', message);
  
  return { 
    content: "A team member is reviewing your conversation. They'll respond shortly.",
    isHumanTakeover: true 
  };
}
```

### Closed Conversation

When `conversation.status === 'closed'`:

```typescript
if (conversation.status === 'closed') {
  // Still save the message for context
  await saveMessage(conversationId, 'user', message);
  
  return {
    content: "This conversation has been closed. Please start a new conversation if you need further assistance.",
    isClosed: true
  };
}
```

### Empty Response Fallback

If AI returns empty content:

```typescript
if (!responseContent || responseContent.trim() === '') {
  // Retry without tools
  const retryResponse = await fetch(OPENROUTER_URL, {
    body: JSON.stringify({
      model: selectedModel,
      messages: messages,
      stream: false
      // No tools - force content generation
    })
  });
  
  responseContent = retryResponse.choices[0]?.message?.content;
  
  // Final fallback
  if (!responseContent) {
    responseContent = "I'm having trouble responding right now. Please try again.";
  }
}
```

---

## File References

### Edge Functions

| File | Purpose |
|------|---------|
| `supabase/functions/widget-chat/index.ts` | Main chat AI logic |
| `supabase/functions/process-knowledge-source/index.ts` | Knowledge embedding & processing |
| `supabase/functions/embed-help-article/index.ts` | Help article embedding |

### Database Tables

| Table | Purpose |
|-------|---------|
| `knowledge_chunks` | Embedded knowledge content (vector 1024) |
| `help_articles` | Help articles with embeddings (vector 1024) |
| `knowledge_sources` | Raw knowledge sources metadata |
| `query_embedding_cache` | Cached query embeddings |
| `response_cache` | Cached AI responses |
| `agent_tools` | Custom tool definitions |

### Database Functions

| Function | Purpose |
|----------|---------|
| `search_knowledge_chunks` | Vector search on knowledge |
| `search_help_articles` | Vector search on articles |
| `search_knowledge_sources` | Legacy vector search |

---

## Threshold Calibration

### Observed Similarity Distribution

Based on production data analysis (December 2024):

| Similarity Range | % of Cached Responses | Recommendation |
|------------------|----------------------|----------------|
| 0.80 - 1.00 | 8% | Premium matches |
| 0.70 - 0.80 | 15% | High confidence |
| **0.65 - 0.70** | **77%** | **Majority of cache hits** |
| 0.60 - 0.65 | ~5% | Borderline, now captured |
| < 0.60 | ~5% | Too low for caching |

### Optimization Changes (December 2024)

| Setting | Previous | Optimized | Rationale |
|---------|----------|-----------|-----------|
| Cache Storage Threshold | 0.65 | **0.60** | Capture 5-10% more responses |
| Lite Model Routing | >0.65 | **>0.60** | Route 10-15% more to cheapest tier |
| Query Embedding TTL | None | **7 days** | Automatic cache cleanup |
| IVFFlat Probes | Default | **10** | Better recall with vector indexes |

### IVFFlat Index Configuration

Vector indexes created with `lists = 20` on all embedding columns:
- `knowledge_chunks.embedding`
- `help_articles.embedding`
- `knowledge_sources.embedding`
- `query_embedding_cache.embedding`

Search functions updated to use `SET LOCAL ivfflat.probes = 10` for improved recall (scanning 10 of 20 lists vs default ~1).

---

## Key Metrics

| Metric | Value |
|--------|-------|
| **AI Provider** | OpenRouter (consolidated) |
| **Embedding Model** | `qwen/qwen3-embedding-8b` |
| **Embedding Dimensions** | 1024 |
| **Default Chat Model** | `google/gemini-2.5-flash` |
| **Lite Model** | `google/gemini-2.5-flash-lite` |
| **Max Conversation History** | 10 messages |
| **Max RAG Chunks** | 3 |
| **Max Response Chunks** | 4 |
| **Cache Hit Threshold** | 0.70 similarity |
| **Cache Store Threshold** | 0.60 similarity |
| **Cache TTL** | 30 days |
| **Query Embedding TTL** | 7 days |
| **Lite Model Threshold** | >0.60 RAG similarity |
| **IVFFlat Probes** | 10 |
| **Streaming** | Disabled (non-streaming) |
| **Estimated Cost/Message** | $0.02 - $0.03 |

---

## Cost Optimization Summary

| Optimization | Savings |
|--------------|---------|
| Qwen3 embeddings (vs OpenAI) | 50% on embeddings |
| Aggressive response caching | 30-50% fewer API calls |
| Smart model routing | 40-60% on chat completions |
| Context window limits | 20-30% on input tokens |
| Quick replies disabled for lite | ~10% for simple queries |
| Lowered thresholds (Dec 2024) | ~5-10% additional caching |
| **Combined Savings** | **75-85%** |

**Before**: ~$0.13 per message  
**After**: ~$0.02-0.03 per message

---

## Cost Optimization History

This section documents the comprehensive AI cost optimization implemented in December 2024.

### Phase 1: Qwen3 Embeddings Migration

**Model**: `qwen/qwen3-embedding-8b` via OpenRouter  
**Dimensions**: 1024 (truncated from 4096 via Matryoshka Representation Learning)

**Files Updated**:
- `supabase/functions/widget-chat/index.ts`
- `supabase/functions/process-knowledge-source/index.ts`
- `supabase/functions/embed-help-article/index.ts`

**Key Changes**:
- Switched from OpenAI `text-embedding-3-small` to Qwen3 via OpenRouter
- Changed API endpoint from `api.openai.com` to `openrouter.ai/api/v1/embeddings`
- Added MRL dimension truncation (4096 → 1024 dimensions)
- Added OpenRouter headers (`HTTP-Referer`, `X-Title`)

**Cost Comparison**:
| Model | Cost per 1M tokens |
|-------|-------------------|
| OpenAI text-embedding-3-small | $0.02 |
| Qwen3-embedding-8b | $0.01 |
| **Savings** | **50%** |

### Phase 2: Database Schema Migration

**Vector Dimensions**: 1536 → 1024

**Tables Updated**:
- `knowledge_chunks.embedding`
- `help_articles.embedding`
- `knowledge_sources.embedding`
- `query_embedding_cache.embedding`

**Migration Actions**:
1. Cleared all existing embeddings
2. Cleared embedding caches
3. Altered vector columns to `vector(1024)`
4. Marked all knowledge sources as `pending` for re-processing

### Phase 3: Aggressive Response Caching

**Threshold Changes**:
| Setting | Before | After |
|---------|--------|-------|
| Cache storage threshold | 0.92 | 0.60 |
| Cache hit threshold | 0.92 | 0.70 |
| Cache TTL | 7 days | 30 days |
| Require sources for caching | Yes | No |

**Impact**: 30-50% fewer AI API calls for FAQ-style queries

### Phase 4: Smart Model Routing

Queries are automatically routed to the most cost-effective model based on complexity:

```
┌─────────────────────────────────────────────────────────────┐
│                    MODEL TIER ROUTING                       │
├─────────────────────────────────────────────────────────────┤
│ TIER 1: LITE (gemini-2.5-flash-lite)                       │
│ • High RAG similarity (>0.60)                               │
│ • Short queries (<15 words)                                 │
│ • No tool usage required                                    │
│ • Short conversation (<5 messages)                          │
│ • Cost: $0.015/M input, $0.06/M output                     │
├─────────────────────────────────────────────────────────────┤
│ TIER 2: STANDARD (gemini-2.5-flash)                        │
│ • Moderate complexity queries                               │
│ • Medium RAG similarity (0.35-0.60)                        │
│ • Cost: $0.15/M input, $0.60/M output                      │
├─────────────────────────────────────────────────────────────┤
│ TIER 3: PREMIUM (agent's configured model)                 │
│ • Low/no RAG match (<0.35)                                 │
│ • Long conversations (>10 messages)                         │
│ • Tool usage required                                       │
│ • Cost: Varies by agent configuration                      │
└─────────────────────────────────────────────────────────────┘
```

**Impact**: 40-60% cost reduction by routing ~75% of queries to cheaper models

### Phase 5: Context Window Optimization

**Implementation**:
- `MAX_CONVERSATION_HISTORY = 10`: Only send last 10 messages to AI
- `MAX_RAG_CHUNKS = 3`: Limit knowledge base context to top 3 most relevant chunks
- `truncateConversationHistory()`: Function to trim older messages

**Impact**: 20-30% reduction in input tokens for long conversations

### Phase 6: Quick Replies Optimization

**Implementation**:
- Quick replies skipped for **Tier 1 (lite)** model queries
- Configurable via `deployment_config.enable_quick_replies` (defaults to true)
- When disabled or tier=lite, tool calls eliminated entirely if no user tools configured

**Impact**: Faster responses and lower cost for FAQ-style queries

### Re-embedding Requirements

After deployment, all knowledge sources need to be re-embedded with Qwen3:

1. Knowledge sources were automatically marked as `pending`
2. Go to Agent Config → Knowledge tab
3. Click "Retrain All" to re-process all sources with new embeddings
4. Help articles will be re-embedded on next save or via bulk retrain

### API Key Consolidation

Only `OPENROUTER_API_KEY` is now required for all AI operations:
- Chat completions
- Embeddings (consolidated from OPENAI_API_KEY)

The `OPENAI_API_KEY` is no longer used for embeddings but may still be configured for other purposes.

---

## Related Documentation

- [Edge Functions](./EDGE_FUNCTIONS.md) - Server-side function implementations
- [Database Schema](./DATABASE_SCHEMA.md) - Knowledge tables and vector storage
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget-side AI integration
- [Hooks Reference](./HOOKS_REFERENCE.md) - Database integration patterns
