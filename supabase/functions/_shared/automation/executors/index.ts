/**
 * Node Executors Index
 * Exports all node executors and provides lookup by node type.
 * 
 * @module _shared/automation/executors
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { executeHttpNode } from "./http.ts";
import { executeDelayNode } from "./delay.ts";
import { executeConditionNode } from "./condition.ts";
import { executeSetVariableNode } from "./set-variable.ts";
import { executeStopNode } from "./stop.ts";
import { executeAiGenerateNode } from "./ai-generate.ts";
import { executeAiClassifyNode } from "./ai-classify.ts";
import { executeAiExtractNode } from "./ai-extract.ts";

// Re-export individual executors
export { executeHttpNode } from "./http.ts";
export { executeDelayNode } from "./delay.ts";
export { executeConditionNode } from "./condition.ts";
export { executeSetVariableNode } from "./set-variable.ts";
export { executeStopNode } from "./stop.ts";
export { executeAiGenerateNode } from "./ai-generate.ts";
export { executeAiClassifyNode } from "./ai-classify.ts";
export { executeAiExtractNode } from "./ai-extract.ts";

// ============================================
// EXECUTOR REGISTRY
// ============================================

type NodeExecutor = (
  node: AutomationNode,
  context: ExecutionContext,
  supabase: unknown
) => Promise<NodeExecutorResult>;

const executorRegistry: Record<string, NodeExecutor> = {
  // Actions
  "action-http": executeHttpNode,
  "action-delay": executeDelayNode,
  
  // Logic
  "logic-condition": executeConditionNode,
  "logic-stop": executeStopNode,
  
  // Transform
  "transform-set-variable": executeSetVariableNode,
  
  // AI
  "ai-generate": executeAiGenerateNode,
  "ai-classify": executeAiClassifyNode,
  "ai-extract": executeAiExtractNode,
};

/**
 * Get the executor function for a node type.
 */
export function getNodeExecutor(nodeType: string): NodeExecutor | undefined {
  return executorRegistry[nodeType];
}

/**
 * Check if a node type has an executor.
 */
export function hasExecutor(nodeType: string): boolean {
  return nodeType in executorRegistry;
}

/**
 * Get all registered node types.
 */
export function getRegisteredNodeTypes(): string[] {
  return Object.keys(executorRegistry);
}

/**
 * Execute a node using the appropriate executor.
 */
export async function executeNode(
  node: AutomationNode,
  context: ExecutionContext,
  supabase: unknown
): Promise<NodeExecutorResult> {
  const executor = getNodeExecutor(node.type);
  
  if (!executor) {
    // Trigger nodes are special - they don't execute, just start the flow
    if (node.type.startsWith("trigger-")) {
      return {
        success: true,
        output: { skipped: true, reason: "Trigger nodes are entry points only" },
      };
    }
    
    return {
      success: false,
      error: `No executor found for node type: ${node.type}`,
    };
  }
  
  return executor(node, context, supabase);
}
