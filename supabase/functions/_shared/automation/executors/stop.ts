/**
 * Stop Node Executor
 * Halts automation execution.
 * 
 * @module _shared/automation/executors/stop
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";

export async function executeStopNode(
  node: AutomationNode,
  _context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as {
    reason?: string;
  };
  
  console.log(`Execution stopped: ${data.reason || "No reason provided"}`);
  
  return {
    success: true,
    shouldStop: true,
    output: {
      reason: data.reason || "Execution halted by stop node",
      stoppedAt: new Date().toISOString(),
    },
  };
}
