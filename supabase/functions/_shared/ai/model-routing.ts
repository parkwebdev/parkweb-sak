/**
 * Model Routing
 * Smart model tier selection for cost optimization.
 * 
 * @module _shared/ai/model-routing
 * @description Provides model tier definitions for routing queries to appropriate models.
 * 
 * @example
 * ```typescript
 * import { MODEL_TIERS, selectModelTier } from "../_shared/ai/model-routing.ts";
 * 
 * const model = MODEL_TIERS.lite; // For simple lookups
 * const tier = selectModelTier(messageCount, toolCount);
 * ```
 */

// ============================================
// MODEL TIER DEFINITIONS
// ============================================

/**
 * Model tiers for smart routing (cost optimization).
 * 
 * - lite: Cheapest, for simple lookups and greetings
 * - standard: Balanced cost/quality for general queries
 * - premium: Uses agent's configured model for complex tasks
 */
export const MODEL_TIERS = {
  /** $0.015/M input, $0.06/M output - simple lookups */
  lite: 'google/gemini-2.5-flash-lite',
  /** $0.15/M input, $0.60/M output - balanced */
  standard: 'google/gemini-2.5-flash',
  // premium uses agent's configured model
} as const;

export type ModelTier = keyof typeof MODEL_TIERS | 'premium';

/**
 * Select appropriate model tier based on conversation complexity.
 * 
 * @param messageCount - Number of messages in conversation
 * @param toolsRequired - Whether tools/function calling is needed
 * @param hasRagContext - Whether RAG context was retrieved
 * @returns Model tier to use
 */
export function selectModelTier(
  messageCount: number,
  toolsRequired: boolean,
  hasRagContext: boolean
): ModelTier {
  // Complex queries with tools or RAG need standard/premium
  if (toolsRequired) {
    return 'standard';
  }
  
  // Initial greeting or simple follow-up
  if (messageCount <= 2 && !hasRagContext) {
    return 'lite';
  }
  
  // Default to standard for balanced performance
  return 'standard';
}
