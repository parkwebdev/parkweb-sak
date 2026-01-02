/**
 * AI Configuration Constants
 * Embedding model settings and response formatting rules.
 * 
 * @module _shared/ai/config
 * @description Provides AI-related configuration constants used across the system.
 * 
 * @example
 * ```typescript
 * import { EMBEDDING_MODEL, MAX_RAG_CHUNKS, RESPONSE_FORMATTING_RULES } from "../_shared/ai/config.ts";
 * ```
 */

// ============================================
// EMBEDDING MODEL CONFIGURATION
// ============================================

/** Qwen3 embedding model via OpenRouter (1024 dimensions - truncated from 4096 via MRL) */
export const EMBEDDING_MODEL = 'qwen/qwen3-embedding-8b';

/** Embedding vector dimensions (truncated via MRL for efficiency) */
export const EMBEDDING_DIMENSIONS = 1024;

// ============================================
// CONTEXT WINDOW OPTIMIZATION CONSTANTS
// ============================================

/** Limit to last N messages to reduce input tokens */
export const MAX_CONVERSATION_HISTORY = 10;

/** Limit RAG context to top N most relevant chunks */
export const MAX_RAG_CHUNKS = 3;

/** Only summarize if over this many messages (worth the extra API call) */
export const SUMMARIZATION_THRESHOLD = 15;

// ============================================
// RESPONSE FORMATTING RULES
// ============================================

/**
 * Response formatting rules for digestible AI responses.
 * Includes chunking guidance for conversational feel.
 */
export const RESPONSE_FORMATTING_RULES = `

RESPONSE FORMATTING (CRITICAL - Follow these rules):

MESSAGE CHUNKING (IMPORTANT):
- Use ||| to separate your response into 1-2 message chunks for a conversational feel
- Chunk 1: Answer the question directly (1-2 sentences max)
- Chunk 2 (optional): Relevant links on their own line
- Simple answers should be 1 chunk (no delimiter needed)
- Max 2 chunks total

CHUNKING EXAMPLES:
Good: "We have 3 plans: Starter $29/mo, Pro $99/mo, and Enterprise (custom). ||| https://example.com/pricing"
Good: "Yes, we support that feature!"
Bad: "I'd be happy to help! Here's everything..." (preamble, too wordy)

OTHER RULES:
- Be CONCISE: Max 1-2 short sentences per chunk
- Skip preamble like "I'd be happy to help" - just answer directly
- Put links on their OWN LINE - never bury links in paragraphs
- Use BULLET POINTS for any list of 3+ items
- Lead with the ANSWER first, then add brief context if needed
- If you're writing more than 30 words without a break, STOP and restructure`;
