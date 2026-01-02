# Widget-Chat Edge Function Refactoring Plan

> **Document Version**: 1.3.0  
> **Created**: 2025-01-01  
> **Updated**: 2025-01-02  
> **Status**: Phase 0 Complete ✅ | Phase 1+ Pending  
> **Target File**: `supabase/functions/widget-chat/index.ts` (4,678 lines)

---

## Implementation Status

| Phase | Description | Status | Verified |
|-------|-------------|--------|----------|
| **Phase 0** | Pre-Refactoring Validation | ✅ **COMPLETE** | 2025-01-02 |
| Phase 1 | Target Architecture | ⏳ Pending | - |
| Phase 2 | Line-by-Line Extraction Map | ⏳ Pending | - |
| Phase 3 | Extraction Order & Procedures | ⏳ Pending | - |
| Phase 4 | Refactored Main Handler | ⏳ Pending | - |
| Phase 5 | Validation Checklist | ⏳ Pending | - |
| Phase 6 | Rollback Plan | ⏳ Pending | - |
| Phase 7 | Documentation Updates | ⏳ Pending | - |

### Phase 0 Completion Details

**Implemented Files:**
- `supabase/functions/widget-chat/__tests__/types.ts` - Type definitions
- `supabase/functions/widget-chat/__tests__/fixtures.ts` - Test fixtures
- `supabase/functions/widget-chat/__tests__/test-utils.ts` - Test utilities
- `supabase/functions/widget-chat/__tests__/snapshot.test.ts` - 44 snapshot tests
- `supabase/functions/widget-chat/__tests__/integration.test.ts` - 8 integration tests
- `supabase/functions/widget-chat/__tests__/baseline-metrics.ts` - Performance baseline tool
- `supabase/functions/widget-chat/__tests__/README.md` - Test documentation

**Test Coverage:**
- ✅ 44 Snapshot Tests (SNAP-001 to SNAP-044)
- ✅ 8 Integration Tests (INT-001 to INT-008)
- ✅ Performance Baseline Tool

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Constraints](#critical-constraints)
3. [Current State Analysis](#current-state-analysis)
4. [Phase 0: Pre-Refactoring Validation](#phase-0-pre-refactoring-validation) ✅
5. [Phase 1: Target Architecture](#phase-1-target-architecture)
6. [Phase 2: Line-by-Line Extraction Map](#phase-2-line-by-line-extraction-map)
7. [Phase 3: Extraction Order & Procedures](#phase-3-extraction-order--procedures)
8. [Phase 4: Refactored Main Handler](#phase-4-refactored-main-handler)
9. [Phase 5: Validation Checklist](#phase-5-validation-checklist)
10. [Phase 6: Rollback Plan](#phase-6-rollback-plan)
11. [Phase 7: Documentation Updates](#phase-7-documentation-updates)
12. [Migration Timeline](#migration-timeline)
13. [Success Criteria](#success-criteria)
14. [Appendix: Complete Line Mapping](#appendix-complete-line-mapping)

---

## Executive Summary

> **Phase 0 is COMPLETE.** The test suite is implemented and ready to validate all extraction steps. Proceed to Phase 1 when ready to begin extraction.

This document provides a **comprehensive, line-by-line refactoring plan** for `supabase/functions/widget-chat/index.ts` (4,678 lines) into modular, maintainable components following industry best practices.

### Current State
- **Single monolithic file**: 4,678 lines
- **Industry standard**: 100-500 lines per function
- **Risk level**: HIGH - Any change can break multiple features

### Target State
- **Main handler**: ~300-400 lines (orchestration only)
- **Shared modules**: 17+ focused modules in `_shared/`
- **Total shared code**: ~4,000 lines across organized modules

### Critical Constraints

| Constraint | Description | Enforcement |
|------------|-------------|-------------|
| **ZERO Visual Regression** | Widget UI must be pixel-perfect identical | Screenshot comparison |
| **ZERO Functionality Changes** | All features must work exactly as before | Snapshot tests |
| **ZERO Broken Behavior** | No new bugs, no edge cases broken | Integration tests |
| **API Contract Immutable** | Request/Response schemas unchanged | TypeScript validation |

---

## Critical Constraints

### 1. Visual Regression Prevention

The following widget UI elements MUST remain visually identical:

| Element | Current Behavior | Validation Method |
|---------|------------------|-------------------|
| Chat bubble layout | Messages render with correct styling | Visual screenshot |
| Quick reply chips | Horizontal scrollable chips below messages | Visual screenshot |
| Day picker | Calendar grid with available dates highlighted | Visual screenshot |
| Time picker | Time slot buttons in grid layout | Visual screenshot |
| Booking confirmation | Success state with booking details | Visual screenshot |
| Link preview cards | OpenGraph-style cards with image/title | Visual screenshot |
| Call action buttons | Phone buttons with location context | Visual screenshot |
| Loading states | Typing indicator animation | Visual inspection |
| Error states | Error message display | Visual screenshot |

### 2. API Contract (IMMUTABLE)

```typescript
// REQUEST SCHEMA - DO NOT MODIFY
interface WidgetChatRequest {
  agentId: string;                          // Required - Agent UUID
  conversationId?: string;                  // Optional - Existing conversation
  messages: Array<{                         // Required - Message history
    role: 'user' | 'assistant';
    content: string;
    files?: FileAttachment[];
  }>;
  leadId?: string;                          // Optional - Known lead UUID
  pageVisits?: PageVisit[];                 // Optional - Page history
  referrerJourney?: ReferrerJourney;        // Optional - Traffic source
  visitorId?: string;                       // Optional - Browser fingerprint
  previewMode?: boolean;                    // Optional - Skip persistence
  browserLanguage?: string;                 // Optional - Browser locale
  turnstileToken?: string;                  // Optional - CAPTCHA token
}

// RESPONSE SCHEMA - DO NOT MODIFY
interface WidgetChatResponse {
  conversationId: string | null;            // Session ID (null in preview)
  requestId: string;                        // Trace ID
  messages: Array<{                         // Chunked response
    id: string;
    content: string;
    chunkIndex: number;
  }>;
  response: string;                         // Legacy: Full response text
  userMessageId?: string;                   // Persisted user message ID
  assistantMessageId?: string;              // Persisted assistant message ID
  sources?: KnowledgeSource[];              // RAG sources used
  toolsUsed?: ToolUsed[];                   // Tools executed
  linkPreviews?: LinkPreview[];             // Extracted link metadata
  quickReplies?: string[];                  // Suggested follow-ups
  callActions?: CallAction[];               // Phone number actions
  dayPicker?: DayPickerData;                // Calendar availability UI
  timePicker?: TimePickerData;              // Time slot selection UI
  bookingConfirmed?: BookingConfirmationData; // Booking success state
  aiMarkedComplete?: boolean;               // Conversation complete flag
  durationMs: number;                       // Request duration
  cached?: boolean;                         // Response cache hit
  similarity?: number;                      // Cache similarity score
  status?: 'active' | 'closed' | 'human_takeover'; // Special states
  takenOverBy?: string;                     // Human agent name
}
```

### 3. Error Response Format (IMMUTABLE)

```typescript
// ERROR RESPONSE - DO NOT MODIFY
interface WidgetChatErrorResponse {
  error: string;                            // Human-readable message
  code: ErrorCode;                          // Machine-readable code
  requestId: string;                        // Trace ID
  durationMs?: number;                      // Request duration
  details?: Record<string, unknown>;        // Debug context
}

// ERROR CODES - EXACT MATCH FROM SOURCE (Lines 13-25)
const ErrorCodes = {
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',       // User message exceeds MAX_MESSAGE_LENGTH
  TOO_MANY_FILES: 'TOO_MANY_FILES',           // Files exceed MAX_FILES_PER_MESSAGE
  INVALID_REQUEST: 'INVALID_REQUEST',         // Missing/malformed request data
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',         // Agent ID doesn't exist
  RATE_LIMITED: 'RATE_LIMITED',               // API key rate limit exceeded
  UNAUTHORIZED: 'UNAUTHORIZED',               // Invalid/revoked API key
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',     // OpenRouter/AI API failure
  EMBEDDING_ERROR: 'EMBEDDING_ERROR',         // Embedding generation failed
  TOOL_EXECUTION_ERROR: 'TOOL_EXECUTION_ERROR', // Tool call failed
  CONVERSATION_CLOSED: 'CONVERSATION_CLOSED', // Conversation is closed
  INTERNAL_ERROR: 'INTERNAL_ERROR',           // Unexpected server error
} as const;
```

### 4. Request Size Constants (Lines 29-31)

```typescript
// Request size limits - DO NOT MODIFY
const MAX_MESSAGE_LENGTH = 10000; // 10,000 characters max per message
const MAX_FILES_PER_MESSAGE = 5;  // Maximum file attachments per message
```

### 5. Context Window Optimization Constants (Lines 268-271)

```typescript
// Context window optimization - tune carefully
const MAX_CONVERSATION_HISTORY = 10; // Limit to last 10 messages for AI context
const MAX_RAG_CHUNKS = 3;            // Top 3 most relevant RAG chunks
const SUMMARIZATION_THRESHOLD = 15;  // Summarize if over 15 messages
```

---

## Current State Analysis

### File Structure Overview

| Section | Lines | Description | Complexity |
|---------|-------|-------------|------------|
| Imports & CORS | 1-7 | Dependencies and headers | Low |
| Error Codes & Limits | 9-31 | Error codes and request limits | Low |
| Structured Logging | 33-84 | Request logging system | Low |
| Error Response Helper | 86-108 | createErrorResponse function | Low |
| Type Definitions | 110-166 | ShownProperty, ConversationMetadata | Low |
| Regex Patterns | 156-159 | URL_REGEX, PHONE_REGEX | Low |
| Phone Extraction | 161-207 | CallAction interface, extractPhoneNumbers | Low |
| Hashing | 209-216 | hashApiKey function | Low |
| Link Previews | 218-262 | fetchLinkPreviews function | Low |
| Embedding Config | 264-271 | EMBEDDING_MODEL, context window constants | Low |
| Response Formatting | 273-296 | RESPONSE_FORMATTING_RULES | Low |
| Security Guardrails | 298-310 | SECURITY_GUARDRAILS prompt injection defense | Medium |
| Output Sanitization | 312-342 | BLOCKED_PATTERNS, sanitizeAiOutput | Medium |
| Content Moderation | 344-431 | OpenAI moderation API integration | Medium |
| Language Detection | 433-553 | LANGUAGE_NAMES map, detectConversationLanguage | Medium |
| State Mapping | 555-577 | STATE_ABBREVIATIONS, normalizeState | Low |
| Model Configuration | 579-584 | MODEL_TIERS definitions | Low |
| Booking UI Types | 586-789 | DayPickerData, TimePickerData, transforms | Medium |
| BOOKING_TOOLS | 791-993 | Tool definitions array | Medium |
| Property Tools | 995-1255 | searchProperties, lookupProperty | High |
| Location Tools | 1257-1305 | getLocations function | Medium |
| Calendar Tools | 1307-1435 | checkCalendarAvailability, bookAppointment | High |
| Model Capabilities | 1437-1550 | MODEL_CAPABILITIES map, model selection | Medium |
| Summarization | 1552-1695 | summarizeConversationHistory, store | High |
| Conversation History | 1697-1856 | DB message fetching, tool persistence | High |
| Tool Cache | 1858-1985 | Redundant call prevention | Medium |
| Semantic Memory | 1987-2214 | Memory search, extraction, formatting | High |
| Query Utilities | 2216-2247 | normalizeQuery, splitResponseIntoChunks | Low |
| RAG & Embeddings | 2249-2496 | Embedding generation, knowledge search | High |
| Geo & User Agent | 2498-2553 | IP lookup, browser parsing, isWidgetRequest | Low |
| Custom Tool Execution | 2555-2767 | SSRF protection, callToolEndpoint | High |
| Main Handler | 2769-4678 | Request processing, AI loop, response | Critical |

### Dependency Analysis

```
widget-chat/index.ts
├── External Dependencies
│   ├── https://deno.land/std@0.168.0/http/server.ts
│   ├── https://esm.sh/@supabase/supabase-js@2.57.2
│   └── External APIs (via fetch):
│       ├── OpenRouter API (chat completions, embeddings)
│       ├── OpenAI API (content moderation)
│       └── ip-api.com (geo-IP lookup)
├── Internal Dependencies
│   └── None currently (monolith)
└── Supabase Tables Used
    ├── agents (read)
    ├── conversations (read/write)
    ├── messages (read/write)
    ├── leads (read/write)
    ├── knowledge_sources (read)
    ├── knowledge_chunks (read)
    ├── help_articles (read via RPC)
    ├── locations (read)
    ├── properties (read)
    ├── conversation_memories (read/write)
    ├── conversation_takeovers (read)
    ├── agent_tools (read)
    ├── connected_accounts (read)
    ├── query_embedding_cache (read/write)
    ├── response_cache (read/write)
    ├── usage_metrics (read/write)
    ├── subscriptions (read)
    ├── plans (read)
    └── security_logs (write)
```

### RPC Functions Used

```typescript
// Supabase RPC calls in widget-chat
supabase.rpc('validate_api_key', { p_key_hash, p_agent_id })
supabase.rpc('search_knowledge_chunks', { p_agent_id, p_query_embedding, ... })
supabase.rpc('search_knowledge_sources', { p_agent_id, p_query_embedding, ... })  // fallback
supabase.rpc('search_help_articles', { p_agent_id, p_query_embedding, ... })
supabase.rpc('search_conversation_memories', { p_agent_id, p_lead_id, ... })
```

---

## Phase 0: Pre-Refactoring Validation ✅ COMPLETE

> **Status**: ✅ VERIFIED AND COMPLETE (2025-01-02)
> 
> All test files have been implemented and are ready for use. Run the tests before proceeding to Phase 1.

### 0.1 Snapshot Test Suite ✅

**File**: `supabase/functions/widget-chat/__tests__/snapshot.test.ts`

| Test ID | Test Case | Input | Expected Response Fields | Priority |
|---------|-----------|-------|-------------------------|----------|
| SNAP-001 | Greeting request | `messages: [{ role: 'user', content: '__GREETING_REQUEST__' }]` | `response`, `conversationId`, `messages` | Critical |
| SNAP-002 | Basic user query | `messages: [{ role: 'user', content: 'Hello' }]` | `response`, `conversationId`, `messages` | Critical |
| SNAP-003 | RAG query (knowledge hit) | Query matching knowledge base | `response`, `sources`, `messages` | Critical |
| SNAP-004 | RAG query (no match) | Query with no KB match | `response`, `messages` (no sources) | High |
| SNAP-005 | Property search | `'Show me 3 bedroom homes'` | `response`, `toolsUsed: ['searchProperties']` | Critical |
| SNAP-006 | Property lookup | `'Tell me about lot 123'` | `response`, `toolsUsed: ['lookupProperty']` | High |
| SNAP-007 | Location list | `'What communities do you have?'` | `response`, `toolsUsed: ['getLocations']` | High |
| SNAP-008 | Calendar availability | `'When can I schedule a tour?'` | `response`, `dayPicker` | Critical |
| SNAP-009 | Time selection | `'I want to visit on Monday'` | `response`, `timePicker` | Critical |
| SNAP-010 | Booking confirmation | `'Book me for 2pm'` | `response`, `bookingConfirmed` | Critical |
| SNAP-011 | Human takeover state | Conversation with takeover | `status: 'human_takeover'`, `takenOverBy` | High |
| SNAP-012 | Closed conversation | Closed conversation | `status: 'closed'`, message | High |
| SNAP-013 | Content moderation (block) | Harmful user message | Polite rejection, no AI response | Critical |
| SNAP-014 | Content moderation (warn) | Borderline content | Response with potential warning | Medium |
| SNAP-015 | API key validation (valid) | Valid X-API-Key header | 200 status, normal response | Critical |
| SNAP-016 | API key validation (invalid) | Invalid X-API-Key header | 401 status, error response | Critical |
| SNAP-017 | API key validation (revoked) | Revoked API key | 401 status, error response | High |
| SNAP-018 | Rate limiting (minute) | Exceed per-minute limit | 429 status, error response | High |
| SNAP-019 | Rate limiting (day) | Exceed per-day limit | 429 status, error response | High |
| SNAP-020 | Preview mode | `previewMode: true` | `conversationId: null`, no DB writes | High |
| SNAP-021 | Quick replies | Standard query | `quickReplies` array with suggestions | Medium |
| SNAP-022 | Link previews | Message containing URLs | `linkPreviews` array | Medium |
| SNAP-023 | Call actions | Message with phone numbers | `callActions` array | Medium |
| SNAP-024 | Message chunking | Long response (>500 chars) | `messages` array with multiple chunks | High |
| SNAP-025 | Response cache hit | Repeated identical query | `cached: true`, `similarity` | Medium |
| SNAP-026 | Embedding cache hit | Repeated query embedding | Faster response, cache logged | Low |
| SNAP-027 | Multi-language (Spanish) | Spanish user message | Response in Spanish | Medium |
| SNAP-028 | Multi-language (French) | French user message | Response in French | Medium |
| SNAP-029 | Semantic memory (recall) | Query about previous info | Memory context in response | High |
| SNAP-030 | Semantic memory (store) | User provides new info | Memory stored for future | High |
| SNAP-031 | Tool cache (skip redundant) | Same property search twice | Second skips tool call | Medium |
| SNAP-032 | Conversation summary | Long conversation (>15 msgs) | Summary generated | Medium |
| SNAP-033 | Custom tool (success) | Custom tool trigger | Tool executed, result in response | High |
| SNAP-034 | Custom tool (SSRF blocked) | Internal URL attempt | Tool blocked, error logged | Critical |
| SNAP-035 | Custom tool (timeout) | Slow external endpoint | Timeout handled gracefully | Medium |
| SNAP-036 | Agent not found | Invalid agentId | `code: 'AGENT_NOT_FOUND'`, 404 | Critical |
| SNAP-037 | Missing messages | Empty messages array | `code: 'INVALID_REQUEST'`, 400 | Critical |
| SNAP-038 | Message too long | >10,000 char message | `code: 'MESSAGE_TOO_LONG'`, 400 | High |
| SNAP-039 | Too many files | >5 files attached | `code: 'TOO_MANY_FILES'`, 400 | High |
| SNAP-040 | AI error (OpenRouter) | OpenRouter failure | `code: 'AI_PROVIDER_ERROR'`, fallback | High |
| SNAP-041 | Tool error (property) | Property DB error | Graceful degradation | Medium |
| SNAP-042 | Tool error (calendar) | Calendar API error | Graceful degradation | Medium |
| SNAP-043 | Usage limit exceeded | Over monthly API call limit | 429 status with limit_reached flag | High |
| SNAP-044 | mark_conversation_complete | AI signals completion | `aiMarkedComplete: true` | Medium |

### 0.2 Integration Test Suite ✅

**File**: `supabase/functions/widget-chat/__tests__/integration.test.ts`

| Test ID | Test Case | Validation Method |
|---------|-----------|-------------------|
| INT-001 | Full greeting flow | E2E with real agent |
| INT-002 | Full property search flow | E2E with real properties |
| INT-003 | Full booking flow (day → time → confirm) | E2E with real calendar |
| INT-004 | Multi-turn conversation | State maintained across messages |
| INT-005 | Lead capture flow | Lead created/updated in DB |
| INT-006 | Memory persistence | Memory survives conversation restart |
| INT-007 | Cache warming | Cache populated after queries |
| INT-008 | Usage metrics increment | API calls counted correctly |

### 0.3 Baseline Performance Metrics ✅

**File**: `supabase/functions/widget-chat/__tests__/baseline-metrics.ts`

| Metric | Measurement Method | Baseline Target |
|--------|-------------------|-----------------|
| Cold start time | First request after deploy | Record value |
| Warm request (cache miss) | Average of 10 requests | Record value |
| Warm request (cache hit) | Average of 10 cached requests | Record value |
| Memory usage | Deno memory metrics | Record value |
| Bundle size | Deployed function size | Record value |

**Run before Phase 1:**
```bash
deno run --allow-all supabase/functions/widget-chat/__tests__/baseline-metrics.ts
```

---

## Phase 1: Target Architecture

### 1.1 New Directory Structure

```
supabase/functions/
├── _shared/
│   │
│   ├── cors.ts                           # CORS headers (NEW)
│   ├── logger.ts                         # Structured logging (NEW)
│   ├── errors.ts                         # Error codes & responses (NEW)
│   ├── types.ts                          # Shared type definitions (NEW)
│   │
│   ├── security/
│   │   ├── index.ts                      # Barrel export
│   │   ├── guardrails.ts                 # Prompt injection defense
│   │   ├── moderation.ts                 # OpenAI content moderation
│   │   └── sanitization.ts               # Output sanitization
│   │
│   ├── ai/
│   │   ├── index.ts                      # Barrel export
│   │   ├── embeddings.ts                 # Embedding generation & caching
│   │   ├── model-routing.ts              # Smart model tier selection
│   │   ├── model-capabilities.ts         # Model parameter support map
│   │   ├── rag.ts                        # Knowledge search & response caching
│   │   └── summarization.ts              # Conversation summarization
│   │
│   ├── memory/
│   │   ├── index.ts                      # Barrel export
│   │   ├── semantic-memory.ts            # Memory search & storage
│   │   ├── conversation-history.ts       # DB message fetching
│   │   └── tool-cache.ts                 # Redundant tool call prevention
│   │
│   ├── tools/
│   │   ├── index.ts                      # Barrel export
│   │   ├── definitions.ts                # BOOKING_TOOLS array
│   │   ├── property-tools.ts             # Property search/lookup/locations
│   │   ├── calendar-tools.ts             # Calendar availability/booking
│   │   ├── custom-tools.ts               # External tool execution + SSRF
│   │   └── booking-ui.ts                 # UI transform functions
│   │
│   └── utils/
│       ├── index.ts                      # Barrel export
│       ├── phone.ts                      # Phone number extraction
│       ├── links.ts                      # URL extraction & previews
│       ├── hashing.ts                    # SHA-256 utilities
│       ├── geo.ts                        # Geo-IP lookup
│       ├── user-agent.ts                 # Browser/device parsing
│       ├── language.ts                   # Language detection
│       ├── state-mapping.ts              # US state abbreviations
│       └── response-chunking.ts          # Message splitting
│
├── widget-chat/
│   └── index.ts                          # SLIM orchestrator (~300-400 lines)
│
└── [other existing functions...]
```

### 1.2 Module Responsibility Matrix

| Module | Single Responsibility | Inputs | Outputs |
|--------|----------------------|--------|---------|
| `cors.ts` | CORS header management | None | `corsHeaders` object |
| `logger.ts` | Request-scoped structured logging | `requestId` | Logger instance |
| `errors.ts` | Error code definitions & response creation | Error details | HTTP Response |
| `types.ts` | Shared type definitions | None | TypeScript types |
| `security/guardrails.ts` | Prompt injection defense rules | None | Prompt strings |
| `security/moderation.ts` | OpenAI content moderation | Content string | ModerationResult |
| `security/sanitization.ts` | Output pattern matching & redaction | AI output | Sanitized string |
| `ai/embeddings.ts` | Qwen3 embedding generation & caching | Query string | Embedding vector |
| `ai/model-routing.ts` | Smart model tier selection | Query complexity | Model name |
| `ai/model-capabilities.ts` | Model parameter support map | Model name | Capability flags |
| `ai/rag.ts` | Knowledge base search & caching | Query, agent | Relevant chunks |
| `ai/summarization.ts` | Conversation history compression | Messages | Summary string |
| `memory/semantic-memory.ts` | Long-term memory search & storage | Query, lead | Memories |
| `memory/conversation-history.ts` | DB message fetching & persistence | Conversation ID | Messages array |
| `memory/tool-cache.ts` | Redundant tool call prevention | Tool name, args | Cached result |
| `tools/definitions.ts` | BOOKING_TOOLS array definition | None | Tool schemas |
| `tools/property-tools.ts` | Property search, lookup, locations | Supabase, args | Property data |
| `tools/calendar-tools.ts` | Calendar availability & booking | Args | Availability data |
| `tools/custom-tools.ts` | SSRF-safe external tool calls | Tool config, args | Tool result |
| `tools/booking-ui.ts` | Transform tool results to UI data | Tool results | UI data objects |
| `utils/phone.ts` | Phone number extraction & formatting | Text | CallAction array |
| `utils/links.ts` | URL extraction & preview fetching | Text | LinkPreview array |
| `utils/hashing.ts` | SHA-256 hashing for keys & queries | String | Hash string |
| `utils/geo.ts` | Geo-IP lookup via ip-api.com | IP address | Location data |
| `utils/user-agent.ts` | Browser/device detection | UA string | DeviceInfo |
| `utils/language.ts` | AI-powered language detection | Messages | Language code |
| `utils/state-mapping.ts` | US state name normalization | State string | Abbreviation |
| `utils/response-chunking.ts` | Response splitting for streaming | Response | Chunk array |

---

## Phase 2: Line-by-Line Extraction Map

### Complete Line Mapping (4,678 lines)

#### Lines 1-108: Core Infrastructure

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 1-2 | Import statements | `widget-chat/index.ts` | KEEP |
| 4-7 | `corsHeaders` constant | `_shared/cors.ts` | MOVE |
| 9-25 | `ErrorCodes` constant | `_shared/errors.ts` | MOVE |
| 27-31 | `MAX_MESSAGE_LENGTH`, `MAX_FILES_PER_MESSAGE` | `_shared/errors.ts` | MOVE |
| 33-46 | `LogLevel`, `LogEntry` types | `_shared/logger.ts` | MOVE |
| 48-84 | `createLogger` function | `_shared/logger.ts` | MOVE |
| 86-108 | `createErrorResponse` function | `_shared/errors.ts` | MOVE |

#### Lines 110-166: Type Definitions

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 110-123 | `ShownProperty` interface | `_shared/types.ts` | MOVE |
| 125-153 | `ConversationMetadata` interface | `_shared/types.ts` | MOVE |
| 155-159 | `URL_REGEX`, `PHONE_REGEX` patterns | `_shared/types.ts` | MOVE |
| 161-166 | `CallAction` interface | `_shared/types.ts` | MOVE |

#### Lines 168-262: Utility Functions

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 168-207 | `extractPhoneNumbers` function | `_shared/utils/phone.ts` | MOVE |
| 209-216 | `hashApiKey` function | `_shared/utils/hashing.ts` | MOVE |
| 218-262 | `fetchLinkPreviews` function | `_shared/utils/links.ts` | MOVE |

#### Lines 264-296: AI Configuration

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 264-266 | `EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS` | `_shared/ai/embeddings.ts` | MOVE |
| 268-271 | `MAX_CONVERSATION_HISTORY`, `MAX_RAG_CHUNKS`, `SUMMARIZATION_THRESHOLD` | `_shared/ai/embeddings.ts` | MOVE |
| 273-296 | `RESPONSE_FORMATTING_RULES` | `_shared/ai/embeddings.ts` | MOVE |

#### Lines 298-342: Security

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 298-310 | `SECURITY_GUARDRAILS` | `_shared/security/guardrails.ts` | MOVE |
| 312-323 | `BLOCKED_PATTERNS` array | `_shared/security/sanitization.ts` | MOVE |
| 325-342 | `sanitizeAiOutput` function | `_shared/security/sanitization.ts` | MOVE |

#### Lines 344-431: Content Moderation

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 344-353 | `ModerationResult` interface | `_shared/security/moderation.ts` | MOVE |
| 355-367 | `HIGH_SEVERITY_CATEGORIES`, `MEDIUM_SEVERITY_CATEGORIES` | `_shared/security/moderation.ts` | MOVE |
| 369-431 | `moderateContent` function | `_shared/security/moderation.ts` | MOVE |

#### Lines 433-577: Language & State Utilities

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 433-471 | `LANGUAGE_NAMES` map | `_shared/utils/language.ts` | MOVE |
| 473-553 | `detectConversationLanguage` function | `_shared/utils/language.ts` | MOVE |
| 555-577 | `STATE_ABBREVIATIONS`, `normalizeState` | `_shared/utils/state-mapping.ts` | MOVE |

#### Lines 579-584: Model Tiers

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 579-584 | `MODEL_TIERS` constant | `_shared/ai/model-routing.ts` | MOVE |

#### Lines 586-789: Booking UI

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 586-620 | `DayPickerData`, `TimePickerData`, `BookingConfirmedData` interfaces | `_shared/tools/booking-ui.ts` | MOVE |
| 622-720 | `transformToDayPickerData`, `transformToTimePickerData` | `_shared/tools/booking-ui.ts` | MOVE |
| 722-789 | `transformToBookingConfirmedData`, `detectSelectedDateFromMessages` | `_shared/tools/booking-ui.ts` | MOVE |

#### Lines 791-993: BOOKING_TOOLS

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 791-993 | `BOOKING_TOOLS` array | `_shared/tools/definitions.ts` | MOVE |

#### Lines 995-1305: Property Tools

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 995-1116 | `searchProperties` function | `_shared/tools/property-tools.ts` | MOVE |
| 1118-1254 | `lookupProperty` function | `_shared/tools/property-tools.ts` | MOVE |
| 1257-1305 | `getLocations` function | `_shared/tools/property-tools.ts` | MOVE |

#### Lines 1307-1435: Calendar Tools

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 1307-1380 | `checkCalendarAvailability` function | `_shared/tools/calendar-tools.ts` | MOVE |
| 1382-1435 | `bookAppointment` function | `_shared/tools/calendar-tools.ts` | MOVE |

#### Lines 1437-1550: Model Capabilities

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 1437-1514 | `MODEL_CAPABILITIES` constant | `_shared/ai/model-capabilities.ts` | MOVE |
| 1516-1535 | `getModelCapabilities` function | `_shared/ai/model-capabilities.ts` | MOVE |
| 1537-1550 | `selectModelTier` function | `_shared/ai/model-routing.ts` | MOVE |

##### MODEL_CAPABILITIES Detail (Lines 1438-1514)

The model capabilities use a parameter-level structure to define which API parameters each model supports:

```typescript
// Interface definitions (Lines 1438-1448)
interface ModelCapability {
  supported: boolean;
}

interface ModelCapabilities {
  temperature: ModelCapability;
  topP: ModelCapability;
  presencePenalty: ModelCapability;
  frequencyPenalty: ModelCapability;
  topK: ModelCapability;
}

// All 9 models with parameter-level capabilities (Lines 1450-1514)
const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'google/gemini-2.5-flash': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'google/gemini-2.5-flash-lite': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'google/gemini-2.5-pro': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'anthropic/claude-sonnet-4': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'anthropic/claude-3.5-haiku': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'openai/gpt-4o': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: false },
  },
  'openai/gpt-4o-mini': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: false },
  },
  'meta-llama/llama-3.3-70b-instruct': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: true },
  },
  'deepseek/deepseek-chat': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: false },
  },
};
```

**Parameter Support Matrix:**

| Model | temperature | topP | presencePenalty | frequencyPenalty | topK |
|-------|-------------|------|-----------------|------------------|------|
| google/gemini-2.5-flash | ✓ | ✓ | ✗ | ✗ | ✓ |
| google/gemini-2.5-flash-lite | ✓ | ✓ | ✗ | ✗ | ✓ |
| google/gemini-2.5-pro | ✓ | ✓ | ✗ | ✗ | ✓ |
| anthropic/claude-sonnet-4 | ✓ | ✓ | ✗ | ✗ | ✓ |
| anthropic/claude-3.5-haiku | ✓ | ✓ | ✗ | ✗ | ✓ |
| openai/gpt-4o | ✓ | ✓ | ✓ | ✓ | ✗ |
| openai/gpt-4o-mini | ✓ | ✓ | ✓ | ✓ | ✗ |
| meta-llama/llama-3.3-70b-instruct | ✓ | ✓ | ✓ | ✓ | ✓ |
| deepseek/deepseek-chat | ✓ | ✓ | ✓ | ✓ | ✗ |

#### Lines 1552-1695: Summarization

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 1552-1575 | `SummarizationResult` interface | `_shared/ai/summarization.ts` | MOVE |
| 1577-1671 | `summarizeConversationHistory` function | `_shared/ai/summarization.ts` | MOVE |
| 1673-1695 | `storeConversationSummary` function | `_shared/ai/summarization.ts` | MOVE |

#### Lines 1697-1856: Conversation History

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 1697-1711 | `DbMessage` interface | `_shared/memory/conversation-history.ts` | MOVE |
| 1713-1740 | `fetchConversationHistory` function | `_shared/memory/conversation-history.ts` | MOVE |
| 1742-1789 | `convertDbMessagesToOpenAI` function | `_shared/memory/conversation-history.ts` | MOVE |
| 1791-1822 | `persistToolCall` function | `_shared/memory/conversation-history.ts` | MOVE |
| 1824-1856 | `persistToolResult` function | `_shared/memory/conversation-history.ts` | MOVE |

#### Lines 1858-1985: Tool Cache

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 1858-1868 | `CachedToolResult` interface | `_shared/memory/tool-cache.ts` | MOVE |
| 1870-1898 | `normalizeToolArgs` function | `_shared/memory/tool-cache.ts` | MOVE |
| 1900-1959 | `findCachedToolResult` function | `_shared/memory/tool-cache.ts` | MOVE |
| 1961-1985 | `getRecentToolCalls` function | `_shared/memory/tool-cache.ts` | MOVE |

#### Lines 1987-2214: Semantic Memory

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 1987-1997 | `SemanticMemory` interface | `_shared/memory/semantic-memory.ts` | MOVE |
| 1999-2043 | `searchSemanticMemories` function | `_shared/memory/semantic-memory.ts` | MOVE |
| 2045-2170 | `extractAndStoreMemories` function | `_shared/memory/semantic-memory.ts` | MOVE |
| 2172-2214 | `formatMemoriesForPrompt` function | `_shared/memory/semantic-memory.ts` | MOVE |

#### Lines 2216-2247: Query Utilities

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 2216-2219 | `normalizeQuery` function | `_shared/utils/response-chunking.ts` | MOVE |
| 2221-2238 | `splitResponseIntoChunks` function | `_shared/utils/response-chunking.ts` | MOVE |
| 2240-2247 | `hashQuery` function | `_shared/utils/hashing.ts` | MOVE |

#### Lines 2249-2496: RAG & Embeddings

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 2249-2285 | `getCachedEmbedding` function | `_shared/ai/embeddings.ts` | MOVE |
| 2287-2310 | `cacheQueryEmbedding` function | `_shared/ai/embeddings.ts` | MOVE |
| 2312-2345 | `getCachedResponse` function | `_shared/ai/rag.ts` | MOVE |
| 2347-2360 | `cacheResponse` function | `_shared/ai/rag.ts` | MOVE |
| 2362-2395 | `generateEmbedding` function | `_shared/ai/embeddings.ts` | MOVE |
| 2397-2496 | `searchKnowledge` function (includes search_help_articles RPC) | `_shared/ai/rag.ts` | MOVE |

#### Lines 2498-2553: Geo & User Agent

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 2498-2522 | `getLocationFromIP` function | `_shared/utils/geo.ts` | MOVE |
| 2524-2546 | `parseUserAgent` function | `_shared/utils/user-agent.ts` | MOVE |
| 2548-2553 | `isWidgetRequest` function | `_shared/utils/user-agent.ts` | MOVE |

#### Lines 2555-2767: Custom Tool Execution

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 2555-2577 | `BLOCKED_URL_PATTERNS` constant | `_shared/tools/custom-tools.ts` | MOVE |
| 2579-2594 | `isBlockedUrl` function | `_shared/tools/custom-tools.ts` | MOVE |
| 2596-2601 | Response size & retry constants | `_shared/tools/custom-tools.ts` | MOVE |
| 2603-2625 | `maskHeadersForLogging` function | `_shared/tools/custom-tools.ts` | MOVE |
| 2627-2632 | `delay` helper function | `_shared/tools/custom-tools.ts` | MOVE |
| 2634-2767 | `callToolEndpoint` function | `_shared/tools/custom-tools.ts` | MOVE |

#### Lines 2769-4678: Main Handler

| Lines | Content | Target | Action |
|-------|---------|--------|--------|
| 2769-2778 | `serve()` setup, requestId, CORS handling | `widget-chat/index.ts` | KEEP (refactor) |
| 2780-2835 | Request parsing, validation (agentId, message length, file count) | `widget-chat/index.ts` | KEEP (refactor) |
| 2837-2910 | Supabase client init, API key/widget auth check | `widget-chat/index.ts` | KEEP (refactor) |
| 2912-2990 | Agent fetching, validation | `widget-chat/index.ts` | KEEP (refactor) |
| 2992-3100 | Conversation state checking (closed, human takeover) | `widget-chat/index.ts` | KEEP (refactor) |
| 3102-3230 | Greeting request handling, user message persistence | `widget-chat/index.ts` | KEEP (refactor) |
| 3232-3244 | User message moderation early return | `widget-chat/index.ts` | KEEP (refactor) |
| 3246-3310 | DB conversation history fetch, usage metrics check | `widget-chat/index.ts` | KEEP (refactor) |
| 3312-3475 | RAG search, cache checks, embedding generation | `widget-chat/index.ts` | KEEP (refactor) |
| 3477-3575 | System prompt construction (user context, memories, formatting) | `widget-chat/index.ts` | KEEP (refactor) |
| 3577-3700 | Property tools instructions, shown properties context | `widget-chat/index.ts` | KEEP (refactor) |
| 3702-3800 | Model selection, AI API request construction | `widget-chat/index.ts` | KEEP (refactor) |
| 3802-4032 | Tool execution loop (all built-in + custom tools) | `widget-chat/index.ts` | KEEP (refactor) |
| 4034-4100 | mark_conversation_complete handling | `widget-chat/index.ts` | KEEP (refactor) |
| 4102-4330 | Post-generation moderation, sanitization | `widget-chat/index.ts` | KEEP (refactor) |
| 4332-4450 | Message persistence, metadata updates | `widget-chat/index.ts` | KEEP (refactor) |
| 4452-4550 | Memory extraction (fire-and-forget pattern) | `widget-chat/index.ts` | KEEP (refactor) |
| 4552-4620 | Response formatting (chunking, link previews, call actions) | `widget-chat/index.ts` | KEEP (refactor) |
| 4622-4678 | Final response construction, error handling | `widget-chat/index.ts` | KEEP (refactor) |

---

## Phase 3: Extraction Order & Procedures

### Extraction Priority Order

Execute extractions in this EXACT order to minimize risk:

| Order | Module | Risk | Dependencies | Est. Time |
|-------|--------|------|--------------|-----------|
| 1 | `cors.ts` | Low | None | 5 min |
| 2 | `errors.ts` | Low | `cors.ts` | 15 min |
| 3 | `logger.ts` | Low | None | 15 min |
| 4 | `types.ts` | Low | None | 20 min |
| 5 | `utils/hashing.ts` | Low | None | 10 min |
| 6 | `utils/phone.ts` | Low | `types.ts` | 15 min |
| 7 | `utils/links.ts` | Low | `types.ts` | 20 min |
| 8 | `utils/state-mapping.ts` | Low | None | 10 min |
| 9 | `utils/response-chunking.ts` | Low | None | 15 min |
| 10 | `utils/geo.ts` | Low | None | 15 min |
| 11 | `utils/user-agent.ts` | Low | None | 15 min |
| 12 | `utils/language.ts` | Medium | OpenRouter | 30 min |
| 13 | `security/guardrails.ts` | Medium | None | 15 min |
| 14 | `security/sanitization.ts` | Medium | `types.ts` | 20 min |
| 15 | `security/moderation.ts` | Medium | OpenAI | 30 min |
| 16 | `ai/model-routing.ts` | Medium | None | 20 min |
| 17 | `ai/model-capabilities.ts` | Medium | None | 20 min |
| 18 | `ai/embeddings.ts` | Medium | OpenRouter | 45 min |
| 19 | `ai/rag.ts` | High | `embeddings.ts`, Supabase RPCs | 45 min |
| 20 | `ai/summarization.ts` | High | OpenRouter | 30 min |
| 21 | `tools/booking-ui.ts` | Medium | `types.ts` | 30 min |
| 22 | `tools/definitions.ts` | Medium | `booking-ui.ts` | 30 min |
| 23 | `tools/property-tools.ts` | High | Supabase | 45 min |
| 24 | `tools/calendar-tools.ts` | High | Edge functions | 45 min |
| 25 | `tools/custom-tools.ts` | High | SSRF protection | 30 min |
| 26 | `memory/conversation-history.ts` | High | Supabase | 45 min |
| 27 | `memory/tool-cache.ts` | High | `conversation-history.ts` | 30 min |
| 28 | `memory/semantic-memory.ts` | High | `embeddings.ts`, Supabase RPCs | 45 min |
| 29 | Main handler refactor | Critical | All modules | 2 hours |

### Extraction Procedure Template

For EACH extraction, follow this procedure:

```markdown
## Extraction [N]: [Module Name]

### Pre-Extraction Checklist
- [ ] Source lines identified: [X-Y]
- [ ] Target file path confirmed
- [ ] No circular dependencies introduced
- [ ] Types extracted or imported
- [ ] All tests passing before extraction

### Extraction Steps
1. Create new file at target path
2. Copy code from source lines
3. Add imports to new file
4. Add exports from new file
5. Update `widget-chat/index.ts` to import from new file
6. Remove extracted code from `widget-chat/index.ts`
7. Run type check: `deno check widget-chat/index.ts`
8. Run tests: [specific test commands]

### Post-Extraction Validation
- [ ] TypeScript compiles without errors
- [ ] All snapshot tests pass
- [ ] No console errors in logs
- [ ] API responses unchanged (diff check)
- [ ] Git commit with clear message

### Rollback Trigger
If ANY of the following occur, rollback immediately:
- [ ] TypeScript compilation fails
- [ ] Any snapshot test fails
- [ ] API response differs from baseline
- [ ] Console errors appear
```

---

### Extraction 1: CORS Headers

**Source Lines**: 4-7  
**Target**: `_shared/cors.ts`  
**Risk Level**: Low  
**Dependencies**: None

#### New File Content

```typescript
// supabase/functions/_shared/cors.ts
/**
 * CORS Headers
 * 
 * Standard CORS headers for all edge functions.
 * These headers allow cross-origin requests from any origin.
 * 
 * @module _shared/cors
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

#### Import Update in Main Handler

```typescript
// widget-chat/index.ts
import { corsHeaders } from "../_shared/cors.ts";
```

#### Validation
- [ ] All responses include CORS headers
- [ ] OPTIONS requests return 204
- [ ] Cross-origin requests work

---

### Extraction 2: Error Handling

**Source Lines**: 9-31, 86-108  
**Target**: `_shared/errors.ts`  
**Risk Level**: Low  
**Dependencies**: `cors.ts`

#### New File Content

```typescript
// supabase/functions/_shared/errors.ts
/**
 * Error Codes & Response Helpers
 * 
 * Standardized error handling for edge functions.
 * Provides consistent error responses across all endpoints.
 * 
 * @module _shared/errors
 */

import { corsHeaders } from "./cors.ts";

/**
 * Standardized error codes for API responses.
 * These codes are machine-readable and should not be changed.
 */
export const ErrorCodes = {
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  INVALID_REQUEST: 'INVALID_REQUEST',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  EMBEDDING_ERROR: 'EMBEDDING_ERROR',
  TOOL_EXECUTION_ERROR: 'TOOL_EXECUTION_ERROR',
  CONVERSATION_CLOSED: 'CONVERSATION_CLOSED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Request size limits
export const MAX_MESSAGE_LENGTH = 10000; // 10,000 characters
export const MAX_FILES_PER_MESSAGE = 5;

/**
 * Creates a standardized error response with CORS headers.
 * 
 * @param requestId - Unique request identifier for tracing
 * @param code - Machine-readable error code
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param durationMs - Optional request duration for metrics
 * @returns Response object with JSON body
 */
export function createErrorResponse(
  requestId: string,
  code: ErrorCode,
  message: string,
  status: number,
  durationMs?: number
): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      code,
      requestId,
      ...(durationMs !== undefined && { durationMs: Math.round(durationMs) }),
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
```

#### Validation
- [ ] Error responses have correct structure
- [ ] HTTP status codes unchanged
- [ ] CORS headers present on errors

---

### Extraction 3: Structured Logging

**Source Lines**: 33-84  
**Target**: `_shared/logger.ts`  
**Risk Level**: Low  
**Dependencies**: None

#### New File Content

```typescript
// supabase/functions/_shared/logger.ts
/**
 * Structured Logging
 * 
 * Request-scoped logging with consistent formatting.
 * All logs include requestId for distributed tracing.
 * 
 * @module _shared/logger
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  requestId: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

export interface Logger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

/**
 * Creates a request-scoped logger instance.
 * 
 * @param requestId - Unique request identifier
 * @returns Logger instance with all methods
 */
export function createLogger(requestId: string): Logger {
  const log = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      level,
      message,
      ...(data && { data }),
    };
    const logStr = JSON.stringify(entry);
    
    switch (level) {
      case 'error':
        console.error(logStr);
        break;
      case 'warn':
        console.warn(logStr);
        break;
      case 'debug':
        console.debug(logStr);
        break;
      default:
        console.log(logStr);
    }
  };

  return {
    debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
    info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
    error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
  };
}
```

#### Validation
- [ ] Logs appear in edge function console
- [ ] JSON format maintained
- [ ] requestId present in all logs

---

### Extraction 4: Type Definitions

**Source Lines**: 110-166  
**Target**: `_shared/types.ts`  
**Risk Level**: Low  
**Dependencies**: None

#### New File Content

```typescript
// supabase/functions/_shared/types.ts
/**
 * Shared Type Definitions
 * 
 * Common interfaces and types used across edge functions.
 * These types define the contract for data structures.
 * 
 * @module _shared/types
 */

/**
 * Property that has been shown to user in conversation.
 * Used to track what properties AI has mentioned for reference resolution.
 */
export interface ShownProperty {
  index: number;          // 1-indexed for user-friendly referencing
  id: string;             // Property UUID
  address: string;        // Display address or lot number
  city: string;
  state: string;
  beds: number | null;
  baths: number | null;
  price: number | null;   // Price in cents
  price_formatted: string; // e.g., "$1,200/mo"
  community: string | null;
  location_id: string | null; // For direct booking without location lookup
}

/**
 * Conversation metadata stored in JSONB column.
 * Contains all conversation context beyond messages.
 */
export interface ConversationMetadata {
  lead_id?: string;
  lead_name?: string;
  lead_email?: string;
  custom_fields?: Record<string, string | number | boolean>;
  country?: string;
  city?: string;
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
  // Property context memory for multi-property scenarios
  shown_properties?: ShownProperty[];
  last_property_search_at?: string;
  // Conversation summarization for context continuity
  conversation_summary?: string;
  summary_generated_at?: string;
  // Language detection for translation banner
  detected_language_code?: string;  // ISO code: 'es', 'fr', 'pt', etc.
  detected_language?: string;       // Full name: 'Spanish', 'French', etc.
}

/**
 * Call action for phone number display.
 * Extracted from AI responses containing phone numbers.
 */
export interface CallAction {
  phoneNumber: string;      // For tel: href (E.164 format)
  displayNumber: string;    // Human-readable format
  locationName?: string;    // Context from location data
}

/**
 * Link preview metadata for URLs in messages.
 */
export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  domain?: string;
}

/**
 * Page visit tracking for analytics.
 */
export interface PageVisit {
  url: string;
  title?: string;
  entered_at: string;
  duration_ms?: number;
}

/**
 * Referrer journey for traffic source tracking.
 */
export interface ReferrerJourney {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  landing_page?: string;
}

/**
 * Knowledge source match from RAG.
 */
export interface KnowledgeSource {
  source: string;
  type: string;
  similarity: number;
  url?: string;
  content?: string;
  chunkIndex?: number;
}

/**
 * Tool usage record for response.
 */
export interface ToolUsed {
  name: string;
  success: boolean;
  durationMs?: number;
}

// Regex patterns for extraction
export const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;
export const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?([2-9][0-9]{2})\)?[-.\s]?([2-9][0-9]{2})[-.\s]?([0-9]{4})\b/g;
```

#### Validation
- [ ] TypeScript compilation succeeds
- [ ] All type usages resolve
- [ ] No type errors in main handler

---

## Phase 4: Refactored Main Handler

After all extractions, `widget-chat/index.ts` becomes a slim orchestrator:

### Target Structure (~350-400 lines)

```typescript
// supabase/functions/widget-chat/index.ts
/**
 * Widget Chat Edge Function
 * 
 * Main orchestrator for AI chat functionality.
 * All heavy logic is delegated to _shared modules.
 * 
 * @module widget-chat
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Core infrastructure
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { ErrorCodes, createErrorResponse, MAX_MESSAGE_LENGTH, MAX_FILES_PER_MESSAGE } from "../_shared/errors.ts";
import type { ConversationMetadata, ShownProperty } from "../_shared/types.ts";

// Security
import { SECURITY_GUARDRAILS } from "../_shared/security/guardrails.ts";
import { moderateContent } from "../_shared/security/moderation.ts";
import { sanitizeAiOutput } from "../_shared/security/sanitization.ts";

// AI
import { 
  generateEmbedding,
  getCachedEmbedding,
  cacheQueryEmbedding,
  EMBEDDING_MODEL,
  MAX_CONVERSATION_HISTORY,
  MAX_RAG_CHUNKS,
  SUMMARIZATION_THRESHOLD,
  RESPONSE_FORMATTING_RULES,
} from "../_shared/ai/embeddings.ts";
import { MODEL_TIERS, selectModelTier } from "../_shared/ai/model-routing.ts";
import { MODEL_CAPABILITIES, getModelCapabilities } from "../_shared/ai/model-capabilities.ts";
import { searchKnowledge, getCachedResponse, cacheResponse } from "../_shared/ai/rag.ts";
import { summarizeConversationHistory, storeConversationSummary } from "../_shared/ai/summarization.ts";

// Memory
import { 
  fetchConversationHistory,
  convertDbMessagesToOpenAI,
  persistToolCall,
  persistToolResult,
} from "../_shared/memory/conversation-history.ts";
import { searchSemanticMemories, extractAndStoreMemories, formatMemoriesForPrompt } from "../_shared/memory/semantic-memory.ts";
import { findCachedToolResult, getRecentToolCalls, normalizeToolArgs } from "../_shared/memory/tool-cache.ts";

// Tools
import { BOOKING_TOOLS } from "../_shared/tools/definitions.ts";
import { searchProperties, lookupProperty, getLocations } from "../_shared/tools/property-tools.ts";
import { checkCalendarAvailability, bookAppointment } from "../_shared/tools/calendar-tools.ts";
import { callToolEndpoint, isBlockedUrl, delay } from "../_shared/tools/custom-tools.ts";
import { 
  transformToDayPickerData,
  transformToTimePickerData,
  transformToBookingConfirmedData,
  detectSelectedDateFromMessages,
} from "../_shared/tools/booking-ui.ts";

// Utilities
import { extractPhoneNumbers } from "../_shared/utils/phone.ts";
import { fetchLinkPreviews } from "../_shared/utils/links.ts";
import { hashApiKey, hashQuery } from "../_shared/utils/hashing.ts";
import { normalizeQuery, splitResponseIntoChunks } from "../_shared/utils/response-chunking.ts";
import { getLocationFromIP } from "../_shared/utils/geo.ts";
import { parseUserAgent, isWidgetRequest } from "../_shared/utils/user-agent.ts";
import { detectConversationLanguage } from "../_shared/utils/language.ts";
import { normalizeState } from "../_shared/utils/state-mapping.ts";

serve(async (req: Request) => {
  // 1. CORS handling (~5 lines)
  // 2. Request parsing & validation (~30 lines)
  // 3. API key / agent validation (~40 lines)
  // 4. Conversation state checking (~30 lines)
  // 5. Greeting request handling (~20 lines)
  // 6. Content moderation pre-check (~15 lines)
  // 7. DB history fetch + usage metrics (~30 lines)
  // 8. Memory & RAG retrieval (~40 lines)
  // 9. System prompt construction (~40 lines)
  // 10. AI API call (~20 lines)
  // 11. Tool execution loop (~60 lines)
  // 12. Post-generation moderation & sanitization (~20 lines)
  // 13. Message persistence (~30 lines)
  // 14. Memory extraction (fire-and-forget) (~15 lines)
  // 15. Response formatting (~25 lines)
  // 16. Final response construction (~20 lines)
});
```

### Main Handler Patterns to Preserve

#### 1. Greeting Request Handling (Lines ~3102-3130)

```typescript
// Special handling for __GREETING_REQUEST__ messages
const lastUserMessage = messages?.[messages.length - 1];
const isGreetingRequest = lastUserMessage?.content === '__GREETING_REQUEST__';

if (isGreetingRequest) {
  // Skip content moderation, RAG, and memory search
  // Generate simple greeting response
  // Return early with minimal processing
}
```

#### 2. Fire-and-Forget Patterns (Used Throughout)

```typescript
// Non-blocking operations that don't affect response
supabase.from('security_logs').insert({...})
  .then(() => console.log('Logged'))
  .catch(err => console.error('Failed to log:', err));

// Memory extraction runs after response is ready
extractAndStoreMemories(supabase, agentId, leadId, conversationId, userMessage, response, apiKey)
  .then(() => {})
  .catch(() => {});
```

#### 3. Usage Metrics Check (Lines ~3256-3303)

```typescript
// Check subscription and usage limits
const { data: subscription } = await supabase
  .from('subscriptions')
  .select('plan_id, plans(limits)')
  .eq('user_id', agent.user_id)
  .eq('status', 'active')
  .maybeSingle();

const maxApiCalls = subscription?.plans?.limits?.max_api_calls_per_month || 1000;

if (currentApiCalls >= maxApiCalls) {
  return new Response(JSON.stringify({ 
    error: 'API call limit exceeded',
    limit_reached: true,
    current: currentApiCalls,
    limit: maxApiCalls,
  }), { status: 429, headers: corsHeaders });
}
```

#### 4. Agent Error Notification (Lines ~4622-4650)

```typescript
// When AI fails, send error notification to agent owner
if (response.status !== 200) {
  supabase.from('notifications').insert({
    user_id: agent.user_id,
    type: 'ai_error',
    title: 'AI Response Error',
    message: `Error in conversation ${conversationId}`,
    data: { agentId, conversationId, error: errorMessage },
  }).then(() => {}).catch(() => {});
}
```

#### 5. Typing Delay (Lines 4397-4402)

The backend implements a natural typing delay before responding to simulate realistic conversation pacing:

```typescript
// Add natural typing delay before responding (2-3 seconds, varied for realism)
const minDelay = 2000; // 2 seconds minimum
const maxDelay = 3000; // 3 seconds maximum
const typingDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
console.log(`Adding natural typing delay: ${typingDelay}ms`);
await new Promise(resolve => setTimeout(resolve, typingDelay));
```

**Key details:**
- Random delay between 2-3 seconds for realism
- Applied after AI response generation, before sending to client
- Logged for debugging purposes

---

### Cache Threshold Constants

The caching system uses different similarity thresholds for different operations:

| Threshold | Value | Location | Purpose |
|-----------|-------|----------|---------|
| Storage threshold | `0.60` | Line 2342 | Minimum similarity to cache a response |
| Retrieval threshold | `0.65` | Line 4405 | Minimum similarity to use cached response |
| RAG tier threshold | `0.60` | Line 1539 | Threshold for lite model tier selection |

**Code references:**

```typescript
// cacheResponse function (Line 2340-2342)
// COST OPTIMIZATION: Cache responses with moderate+ similarity (was 0.92, now 0.60)
// OPTIMIZED: Lowered from 0.65 to 0.60 based on observed 77% of cached responses in 0.65-0.70 range
if (similarity < 0.60) return;

// Main handler response caching (Lines 4404-4406)
// COST OPTIMIZATION: Cache responses with moderate+ similarity (AGGRESSIVE - lowered from 0.92)
if (queryHash && maxSimilarity > 0.65) {
  console.log(`Caching response with similarity ${maxSimilarity.toFixed(2)} for future reuse`);
  cacheResponse(supabase, queryHash, agentId, assistantContent, maxSimilarity);
}

// RAG tier selection (Line 1539)
// OPTIMIZED: Lowered threshold from 0.65 to 0.60 based on observed similarity distribution
if (ragSimilarity > 0.60 && wordCount < 15 && !requiresTools && conversationLength < 5) {
  return { model: MODEL_TIERS.lite, tier: 'lite' };
}
```

---

### Built-in Tool: `mark_conversation_complete` (Lines 3791-3856)

This built-in tool allows the AI to intelligently determine when a conversation has reached a natural conclusion, triggering satisfaction rating prompts.

**Tool Definition:**
```typescript
const markCompleteTool = {
  type: 'function',
  function: {
    name: 'mark_conversation_complete',
    description: `Intelligently determine if a conversation has reached a natural conclusion. 
                  Current conversation has ${userMessageCount} user messages.`,
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
```

**Completion Criteria (Intercom-style):**

| Criteria | Confidence | Requirements |
|----------|------------|--------------|
| Explicit farewell + 1+ exchanges | HIGH | Clear farewell phrase with positive sentiment, no pending questions |
| Standard completion (3+ exchanges) | HIGH | User expresses satisfaction, no pending questions, original inquiry addressed |
| Ambiguous acknowledgment | MEDIUM | Just "ok", "thanks", "got it" without elaboration |

**Explicit Farewell Pattern (Line 3956):**
```typescript
const EXPLICIT_FAREWELL_PATTERNS = /\b(goodbye|bye|no(\s+(thanks?|thank you))?|nope|nothing(\s+else)?|not (right now|at the moment|at this time)|thanks[\s,!.]+that'?s?\s*(all|it|perfect|great|exactly|what i needed)|have a (great|good|nice) (day|one)|take care|perfect[\s,!.]+thank|got (it|what i needed)|all set|that answers|you'?ve been (very )?helpful|that'?s? (all|exactly|perfect|great)|i'?m (all )?set)\b/i;
```

**Negative Patterns (Prevent false completion):**
- Question marks after acknowledgment
- "but...", "however...", "also...", "one more thing..."
- User frustration or confusion

**Behavior:**
- Always included in tool list (unlike `suggest_quick_replies`)
- Only marks complete with HIGH confidence
- Sets `aiMarkedComplete: true` in response
- Updates conversation metadata with completion context

---

### Built-in Tool: `suggest_quick_replies` (Lines 3764-3785)

This conditional built-in tool allows the AI to suggest follow-up options for users, rendered as clickable chips in the widget.

**Conditional Inclusion (Lines 3760-3761):**
```typescript
const enableQuickReplies = deploymentConfig.enable_quick_replies !== false;
const shouldIncludeQuickReplies = enableQuickReplies && modelTier !== 'lite';
```

**Inclusion Criteria:**
- `enable_quick_replies` deployment config is not explicitly `false`
- Model tier is NOT `lite` (to save tokens on cheap tier)

**Tool Definition:**
```typescript
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
          items: { type: 'string' },
          minItems: 2,
          maxItems: 4
        }
      },
      required: ['suggestions']
    }
  }
} : null;
```

**Handler (Lines 3936-3943):**
```typescript
if (toolName === 'suggest_quick_replies') {
  console.log('AI suggested quick replies:', toolArgs.suggestions);
  quickReplies = (toolArgs.suggestions || []).slice(0, 4).map((s: string) =>
    s.length > 40 ? s.substring(0, 37) + '...' : s
  );
  // Don't add to toolResults - this is a client-side only tool
  continue;
}
```

**Behavior:**
- Conditionally included based on config and model tier
- Suggestions truncated to 40 characters max
- Not persisted to tool results (client-side only)
- Returned in response as `quickReplies` array

---

## Phase 5: Validation Checklist

### 5.1 Pre-Deployment Validation

| # | Check | Method | Pass Criteria | Status |
|---|-------|--------|---------------|--------|
| 1 | TypeScript compilation | `deno check widget-chat/index.ts` | No errors | ☐ |
| 2 | All imports resolve | `deno cache widget-chat/index.ts` | No missing modules | ☐ |
| 3 | Snapshot tests pass | Run all 44 snapshot tests | 100% pass | ☐ |
| 4 | Integration tests pass | Run all 8 integration tests | 100% pass | ☐ |
| 5 | No console errors | Check Supabase logs | Zero errors | ☐ |

### 5.2 API Contract Validation

| # | Check | Method | Pass Criteria | Status |
|---|-------|--------|---------------|--------|
| 1 | Request schema unchanged | TypeScript comparison | Identical | ☐ |
| 2 | Response schema unchanged | TypeScript comparison | Identical | ☐ |
| 3 | Error format unchanged | Snapshot diff | Identical | ☐ |
| 4 | HTTP status codes unchanged | Integration tests | All match | ☐ |

### 5.3 Functionality Validation

| # | Feature | Test Method | Pass Criteria | Status |
|---|---------|-------------|---------------|--------|
| 1 | Greeting request | SNAP-001 | Response generated | ☐ |
| 2 | RAG context injection | SNAP-003 | Sources in response | ☐ |
| 3 | Property search | SNAP-005 | Properties returned | ☐ |
| 4 | Property lookup | SNAP-006 | Property details | ☐ |
| 5 | Location list | SNAP-007 | Locations returned | ☐ |
| 6 | Calendar availability | SNAP-008 | dayPicker in response | ☐ |
| 7 | Time selection | SNAP-009 | timePicker in response | ☐ |
| 8 | Booking confirmation | SNAP-010 | bookingConfirmed | ☐ |
| 9 | Human takeover | SNAP-011 | Correct status | ☐ |
| 10 | Closed conversation | SNAP-012 | Correct message | ☐ |
| 11 | Content moderation | SNAP-013, 014 | Appropriate blocking | ☐ |
| 12 | API key validation | SNAP-015-017 | Correct auth | ☐ |
| 13 | Rate limiting | SNAP-018, 019 | 429 when exceeded | ☐ |
| 14 | Preview mode | SNAP-020 | No persistence | ☐ |
| 15 | Quick replies | SNAP-021 | Suggestions returned | ☐ |
| 16 | Link previews | SNAP-022 | Previews attached | ☐ |
| 17 | Call actions | SNAP-023 | Phone buttons | ☐ |
| 18 | Message chunking | SNAP-024 | Multiple chunks | ☐ |
| 19 | Response caching | SNAP-025 | Cache hit | ☐ |
| 20 | Embedding caching | SNAP-026 | Faster response | ☐ |
| 21 | Multi-language | SNAP-027, 028 | Correct language | ☐ |
| 22 | Semantic memory | SNAP-029, 030 | Memory works | ☐ |
| 23 | Tool cache | SNAP-031 | Redundant skipped | ☐ |
| 24 | Summarization | SNAP-032 | Summary generated | ☐ |
| 25 | Custom tools | SNAP-033-035 | Correct execution | ☐ |
| 26 | Error handling | SNAP-036-042 | Graceful degradation | ☐ |
| 27 | Usage limits | SNAP-043 | 429 with limit_reached | ☐ |
| 28 | AI completion signal | SNAP-044 | aiMarkedComplete set | ☐ |

### 5.4 Performance Validation

| Metric | Baseline | Post-Refactor | Delta | Status |
|--------|----------|---------------|-------|--------|
| Cold start time | ___ms | ___ms | ±__% | ☐ |
| Cache miss response | ___ms | ___ms | ±__% | ☐ |
| Cache hit response | ___ms | ___ms | ±__% | ☐ |
| Memory usage | ___MB | ___MB | ±__% | ☐ |
| Bundle size | ___KB | ___KB | ±__% | ☐ |

**Pass Criteria**: All metrics within ±10% of baseline

### 5.5 Visual Regression Validation

| # | Element | Screenshot Before | Screenshot After | Status |
|---|---------|-------------------|------------------|--------|
| 1 | Chat bubble layout | ☐ Captured | ☐ Compared | ☐ |
| 2 | Quick reply chips | ☐ Captured | ☐ Compared | ☐ |
| 3 | Day picker | ☐ Captured | ☐ Compared | ☐ |
| 4 | Time picker | ☐ Captured | ☐ Compared | ☐ |
| 5 | Booking confirmation | ☐ Captured | ☐ Compared | ☐ |
| 6 | Link preview cards | ☐ Captured | ☐ Compared | ☐ |
| 7 | Call action buttons | ☐ Captured | ☐ Compared | ☐ |
| 8 | Loading states | ☐ Captured | ☐ Compared | ☐ |
| 9 | Error states | ☐ Captured | ☐ Compared | ☐ |

---

## Phase 6: Rollback Plan

### 6.1 Git Strategy

```bash
# Before starting
git checkout main
git pull origin main
git checkout -b refactor/widget-chat-modularization

# Tag the starting point
git tag pre-refactor-widget-chat-$(date +%Y%m%d)

# After each extraction group
git add .
git commit -m "Extract [module-name] to _shared/[path] - Lines [X-Y]"

# After each validation pass
git tag post-extraction-[N]-$(date +%Y%m%d)
```

### 6.2 Rollback Triggers

Immediately rollback if ANY of these occur:

| Trigger | Detection Method | Rollback Action |
|---------|------------------|-----------------|
| TypeScript compilation fails | `deno check` | `git revert HEAD` |
| Snapshot test fails | Test runner | `git revert HEAD` |
| API response differs | Diff check | `git revert HEAD` |
| Console errors appear | Log monitoring | `git revert HEAD` |
| Performance degrades >15% | Metrics | `git revert HEAD` |
| Visual regression detected | Screenshot diff | `git revert HEAD` |

### 6.3 Rollback Procedure

```bash
# Identify the problem commit
git log --oneline

# Option 1: Revert specific commit
git revert [commit-hash]

# Option 2: Reset to last known good state
git reset --hard [tag-name]

# Option 3: Full rollback to pre-refactor
git reset --hard pre-refactor-widget-chat-$(date +%Y%m%d)

# Deploy the rollback
# (Automatic via Supabase function deployment)
```

### 6.4 Partial Rollback

If only specific modules cause issues:

1. Identify failing module
2. Revert that module's extraction commit
3. Re-inline the code into main handler
4. Continue with remaining extractions

---

## Phase 7: Documentation Updates

After successful refactoring, update these documents:

### 7.1 EDGE_FUNCTIONS.md Updates

```markdown
## widget-chat

The widget-chat function has been refactored into modular components:

### File Structure
- `widget-chat/index.ts` - Main orchestrator (~350-400 lines)
- `_shared/cors.ts` - CORS headers
- `_shared/logger.ts` - Structured logging
- `_shared/errors.ts` - Error codes and response helper
- `_shared/types.ts` - Shared type definitions
- `_shared/security/` - Security guardrails, moderation, sanitization
- `_shared/ai/` - Embeddings, RAG, model routing, summarization
- `_shared/memory/` - Conversation history, semantic memory, tool cache
- `_shared/tools/` - Tool definitions and implementations
- `_shared/utils/` - Utility functions

### Adding New Features
1. Identify the appropriate module
2. Add functionality to that module
3. Import and use in main handler
4. Run validation suite
```

### 7.2 AI_ARCHITECTURE.md Updates

```markdown
## Module Organization

### Embeddings (`_shared/ai/embeddings.ts`)
- Qwen3 embedding model configuration (1024 dimensions)
- Context window constants (MAX_CONVERSATION_HISTORY, MAX_RAG_CHUNKS)
- Embedding generation and caching
- Response formatting rules

### RAG (`_shared/ai/rag.ts`)
- Knowledge search (chunks + help articles)
- Response caching thresholds:
  - Storage: 0.60 similarity (Line 2342)
  - Retrieval: 0.65 similarity (Line 4405)
- Context formatting for system prompt

### Model Routing (`_shared/ai/model-routing.ts`)
- MODEL_TIERS: standard, lite
- Dynamic tier selection based on query complexity

### Model Capabilities (`_shared/ai/model-capabilities.ts`)
- Per-model capability flags (supportsTools, maxTokens)
- 9 models currently supported
```

### 7.3 SECURITY.md Updates

```markdown
## Security Module Location

Security components are now in `_shared/security/`:

- `guardrails.ts` - Prompt injection defense (SECURITY_GUARDRAILS)
- `moderation.ts` - OpenAI content moderation (omni-moderation-latest)
- `sanitization.ts` - Output scrubbing (BLOCKED_PATTERNS, sanitizeAiOutput)
```

---

## Migration Timeline

### Estimated Duration

| Phase | Duration | Risk | Milestone |
|-------|----------|------|-----------|
| Phase 0: Tests | 3-4 hours | None | Baseline captured |
| Extractions 1-11 | 2-3 hours | Low | Utilities complete |
| Extraction 12 | 0.5 hours | Medium | Language done |
| Extractions 13-15 | 1.5 hours | Medium | Security done |
| Extractions 16-20 | 3-4 hours | Medium-High | AI done |
| Extractions 21-25 | 3-4 hours | High | Tools done |
| Extractions 26-28 | 2-3 hours | High | Memory done |
| Phase 4: Handler | 2-3 hours | Critical | Orchestrator done |
| Phase 5: Validation | 2-3 hours | None | All tests pass |
| Phase 7: Docs | 1-2 hours | None | Docs updated |

**Total: 20-28 hours** (recommend 3-5 days with breaks)

### Recommended Schedule

| Day | Work | Hours | Checkpoint |
|-----|------|-------|------------|
| Day 1 | Phase 0 + Extractions 1-11 | 6-7 | Utilities complete |
| Day 2 | Extractions 12-20 | 6-7 | Security + AI complete |
| Day 3 | Extractions 21-28 | 6-7 | Tools + Memory complete |
| Day 4 | Phase 4 + Phase 5 | 4-6 | Handler + Validation |
| Day 5 | Phase 7 + Buffer | 2-4 | Documentation + Fixes |

---

## Success Criteria

The refactoring is **COMPLETE** when ALL of the following are true:

### Code Quality
- [ ] Main handler is under 400 lines
- [ ] All modules have single responsibility
- [ ] No circular dependencies
- [ ] All modules have JSDoc documentation
- [ ] TypeScript compiles without errors

### Testing
- [ ] All 44 snapshot tests pass
- [ ] All 8 integration tests pass
- [ ] No console errors in logs
- [ ] Edge function deploys successfully

### API Contract
- [ ] Request schema unchanged
- [ ] Response schema unchanged
- [ ] Error format unchanged (with correct ErrorCodes)
- [ ] All HTTP status codes unchanged

### Performance
- [ ] Cold start within 10% of baseline
- [ ] Response time within 10% of baseline
- [ ] Memory usage within 10% of baseline

### Visual
- [ ] All 9 visual elements match screenshots
- [ ] No UI regressions
- [ ] No design changes

### Documentation
- [ ] EDGE_FUNCTIONS.md updated
- [ ] AI_ARCHITECTURE.md updated
- [ ] SECURITY.md updated
- [ ] WIDGET_ARCHITECTURE.md updated

---

## Appendix: Complete Line Mapping

### Summary Table

| Line Range | Line Count | Target Location | Category |
|------------|------------|-----------------|----------|
| 1-2 | 2 | KEEP in main | Imports |
| 4-7 | 4 | `_shared/cors.ts` | Infrastructure |
| 9-31 | 23 | `_shared/errors.ts` | Infrastructure |
| 33-84 | 52 | `_shared/logger.ts` | Infrastructure |
| 86-108 | 23 | `_shared/errors.ts` | Infrastructure |
| 110-166 | 57 | `_shared/types.ts` | Types |
| 168-207 | 40 | `_shared/utils/phone.ts` | Utilities |
| 209-216 | 8 | `_shared/utils/hashing.ts` | Utilities |
| 218-262 | 45 | `_shared/utils/links.ts` | Utilities |
| 264-296 | 33 | `_shared/ai/embeddings.ts` | AI |
| 298-310 | 13 | `_shared/security/guardrails.ts` | Security |
| 312-342 | 31 | `_shared/security/sanitization.ts` | Security |
| 344-431 | 88 | `_shared/security/moderation.ts` | Security |
| 433-553 | 121 | `_shared/utils/language.ts` | Utilities |
| 555-577 | 23 | `_shared/utils/state-mapping.ts` | Utilities |
| 579-584 | 6 | `_shared/ai/model-routing.ts` | AI |
| 586-789 | 204 | `_shared/tools/booking-ui.ts` | Tools |
| 791-993 | 203 | `_shared/tools/definitions.ts` | Tools |
| 995-1305 | 311 | `_shared/tools/property-tools.ts` | Tools |
| 1307-1435 | 129 | `_shared/tools/calendar-tools.ts` | Tools |
| 1437-1535 | 99 | `_shared/ai/model-capabilities.ts` | AI |
| 1537-1550 | 14 | `_shared/ai/model-routing.ts` | AI |
| 1552-1695 | 144 | `_shared/ai/summarization.ts` | AI |
| 1697-1856 | 160 | `_shared/memory/conversation-history.ts` | Memory |
| 1858-1985 | 128 | `_shared/memory/tool-cache.ts` | Memory |
| 1987-2214 | 228 | `_shared/memory/semantic-memory.ts` | Memory |
| 2216-2247 | 32 | `_shared/utils/response-chunking.ts` | Utilities |
| 2249-2496 | 248 | `_shared/ai/embeddings.ts` + `_shared/ai/rag.ts` | AI |
| 2498-2553 | 56 | `_shared/utils/geo.ts` + `_shared/utils/user-agent.ts` | Utilities |
| 2555-2767 | 213 | `_shared/tools/custom-tools.ts` | Tools |
| 2769-4678 | 1910 | KEEP in main (refactored) | Main Handler |

### Category Totals

| Category | Lines Extracted | Target Files |
|----------|-----------------|--------------|
| Infrastructure | 104 | 3 files (cors, errors, logger) |
| Types | 57 | 1 file |
| Utilities | 325 | 8 files |
| Security | 132 | 3 files |
| AI | 544 | 5 files |
| Tools | 1060 | 5 files |
| Memory | 516 | 3 files |
| **Main Handler** | 1910 | 1 file (refactored) |
| **TOTAL** | 4648 | 29 files |

> **Note**: The category totals sum to 4648 lines. The 30-line discrepancy from the 4678 total is accounted for by:
> - Lines 1-2: Imports (kept in main, not counted in categories)
> - Line overlaps in shared utilities between categories
> - The actual source file is 4678 lines; the main handler calculation (4678 - 2769 + 1 = 1910) is correct.

---

## Changelog

### Version 1.2.0 (2025-01-01)

**Final corrections from exhaustive review:**

1. **Typing Delay** - Corrected to document actual backend implementation:
   - 2-3 second random delay (Lines 4397-4402)
   - NOT handled by frontend as previously stated

2. **MODEL_CAPABILITIES** - Fixed structure to match actual implementation:
   - Changed from simplified `{ supportsTools, supportsStreaming, maxTokens }` 
   - To actual parameter-level capabilities: `{ temperature, topP, presencePenalty, frequencyPenalty, topK }`
   - Updated model list to exact 9 models from source with correct names
   - Added parameter support matrix table

3. **Cache Thresholds** - Added explicit documentation:
   - Storage threshold: 0.60 (Line 2342)
   - Retrieval threshold: 0.65 (Line 4405)
   - RAG tier threshold: 0.60 (Line 1539)

4. **`mark_conversation_complete` Tool** - Added complete documentation:
   - Full parameter schema (reason, confidence, user_signal, sentiment, has_pending_questions)
   - Completion criteria table (Intercom-style)
   - Farewell pattern regex
   - Negative pattern handling

5. **`suggest_quick_replies` Tool** - Added complete documentation:
   - Conditional inclusion logic (config + model tier)
   - Parameter schema
   - Truncation behavior (40 char max)
   - Client-side only handling

6. **Appendix Line Totals** - Verified and corrected:
   - Main handler count confirmed: 1910 lines (4678 - 2769 + 1)
   - Added note explaining 30-line discrepancy in category totals

---

### Version 1.1.0 (2025-01-01)

**Corrections from source code review:**

1. **ErrorCodes** - Fixed to match actual implementation:
   - Added: `MESSAGE_TOO_LONG`, `TOO_MANY_FILES`, `EMBEDDING_ERROR`, `AI_PROVIDER_ERROR`
   - Corrected: `VALIDATION_ERROR` → `INVALID_REQUEST`, `AI_ERROR` → `AI_PROVIDER_ERROR`
   - Removed: `CONTENT_BLOCKED` (not in source)

2. **Constants** - Added missing request limits:
   - `MAX_MESSAGE_LENGTH = 10000`
   - `MAX_FILES_PER_MESSAGE = 5`
   - `MAX_CONVERSATION_HISTORY = 10`
   - `MAX_RAG_CHUNKS = 3`
   - `SUMMARIZATION_THRESHOLD = 15`

3. **Interfaces** - Updated to match actual fields:
   - `ShownProperty`: Added `city`, `state`, `price_formatted`, `location_id`
   - `ConversationMetadata`: Added `custom_fields`, `session_id`, `detected_language_code`

4. **MODEL_CAPABILITIES** - Documented all 9 models including:
   - `deepseek/deepseek-chat`
   - `meta-llama/llama-3.3-70b-instruct`
   - `google/gemini-2.5-flash-lite`

5. **Missing functions** - Added documentation for:
   - `delay()` helper
   - `isWidgetRequest()`
   - `detectSelectedDateFromMessages()`
   - `getModelCapabilities()`
   - `selectModelTier()`

6. **RPC Functions** - Documented `search_help_articles` RPC usage

7. **Main Handler Patterns** - Added sections for:
   - Greeting request handling
   - Fire-and-forget patterns
   - Usage metrics check
   - Agent error notifications

8. **Snapshot Tests** - Updated test count to 44, added:
   - SNAP-038: Message too long
   - SNAP-039: Too many files
   - SNAP-043: Usage limit exceeded
   - SNAP-044: mark_conversation_complete

9. **Line Mappings** - Corrected all line ranges to match 4,678 line source

---

### Version 1.0.0 (2025-01-01)

- Initial comprehensive refactoring plan
- Line-by-line extraction map
- 42 snapshot test definitions
- Full validation checklist

---

## Related Documentation

- [Edge Functions](./EDGE_FUNCTIONS.md) - Widget-chat function reference
- [Widget Architecture](./WIDGET_ARCHITECTURE.md) - Widget technical docs
- [AI Architecture](./AI_ARCHITECTURE.md) - RAG and AI patterns
