/**
 * Model Routing
 * 2-tier model selection for cost optimization.
 * 
 * @module _shared/ai/model-routing
 * @description Routes queries to Lite or Standard models based on complexity.
 * 
 * ## How It Works
 * - **Lite**: Gemini 2.5 Flash Lite - for simple greetings and short follow-ups
 * - **Standard**: Gemini 2.5 Flash - for everything else (tools, RAG, complex queries)
 * 
 * @example
 * ```typescript
 * import { MODEL_TIERS, selectModelTier } from "../_shared/ai/model-routing.ts";
 * 
 * const model = MODEL_TIERS.lite; // Simple lookups
 * const tier = selectModelTier(messageCount, hasTools, hasRag);
 * ```
 */

// ============================================
// MODEL TIER DEFINITIONS
// ============================================

/**
 * 2-tier model routing for cost optimization.
 * 
 * - lite: Cheapest, for simple greetings and short follow-ups
 * - standard: Full capability for tools, RAG, and complex queries
 */
export const MODEL_TIERS = {
  /** Claude Haiku 4.5 - optimized for RAG, tool use, multi-prompt flows */
  lite: 'anthropic/claude-haiku-4.5',
  /** Claude Sonnet 4.5 - best customer service quality for complex conversations */
  standard: 'anthropic/claude-sonnet-4.5',
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;

/**
 * Select appropriate model tier based on conversation complexity.
 * 
 * @param messageCount - Number of messages in conversation
 * @param toolsRequired - Whether tools/function calling is needed
 * @param hasRagContext - Whether RAG context was retrieved
 * @returns 'lite' for simple queries, 'standard' for everything else
 */
export function selectModelTier(
  messageCount: number,
  toolsRequired: boolean,
  hasRagContext: boolean
): ModelTier {
  // Tools or RAG require standard tier
  if (toolsRequired || hasRagContext) {
    return 'standard';
  }
  
  // Simple greeting or short follow-up can use lite
  if (messageCount <= 2) {
    return 'lite';
  }
  
  // Default to standard for longer conversations
  return 'standard';
}
