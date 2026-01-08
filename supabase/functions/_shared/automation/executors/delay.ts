/**
 * Delay Node Executor
 * Pauses execution for a specified duration.
 * 
 * @module _shared/automation/executors/delay
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";

/** Maximum delay in milliseconds (5 minutes) */
const MAX_DELAY_MS = 5 * 60 * 1000;

export async function executeDelayNode(
  node: AutomationNode,
  _context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as {
    delay?: number;
    unit?: "seconds" | "minutes" | "hours";
  };
  
  // Default to 5 seconds
  const delayValue = data.delay || 5;
  const unit = data.unit || "seconds";
  
  // Convert to milliseconds
  let delayMs: number;
  switch (unit) {
    case "minutes":
      delayMs = delayValue * 60 * 1000;
      break;
    case "hours":
      delayMs = delayValue * 60 * 60 * 1000;
      break;
    case "seconds":
    default:
      delayMs = delayValue * 1000;
  }
  
  // Cap at maximum
  if (delayMs > MAX_DELAY_MS) {
    console.warn(
      `Delay of ${delayMs}ms exceeds maximum of ${MAX_DELAY_MS}ms, capping`
    );
    delayMs = MAX_DELAY_MS;
  }
  
  console.log(`Delaying execution for ${delayMs}ms`);
  
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  
  return {
    success: true,
    output: {
      delayedMs: delayMs,
      delayedAt: new Date().toISOString(),
    },
  };
}
