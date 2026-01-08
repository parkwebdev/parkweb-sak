/**
 * Variable Resolver
 * Resolves template variables in automation node configurations.
 * 
 * @module _shared/automation/variable-resolver
 * 
 * @example
 * ```typescript
 * const resolved = resolveVariables("Hello {{lead.name}}", context);
 * ```
 */

import type { ExecutionContext } from "./types.ts";

// ============================================
// VARIABLE RESOLUTION
// ============================================

/**
 * Pattern to match template variables: {{variable.path}}
 */
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * Resolve all template variables in a string.
 * Supports nested paths like {{lead.data.custom_field}}
 */
export function resolveVariables(
  template: string,
  context: ExecutionContext
): string {
  if (!template || typeof template !== "string") {
    return template;
  }

  return template.replace(VARIABLE_PATTERN, (match, path) => {
    const trimmedPath = path.trim();
    const value = getValueFromPath(trimmedPath, context);
    
    if (value === undefined || value === null) {
      console.warn(`Variable not found: ${trimmedPath}`);
      return match; // Keep original if not found
    }
    
    // Convert objects/arrays to JSON string
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return String(value);
  });
}

/**
 * Resolve variables in an object recursively.
 */
export function resolveObjectVariables<T extends Record<string, unknown>>(
  obj: T,
  context: ExecutionContext
): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = resolveVariables(value, context);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "string"
          ? resolveVariables(item, context)
          : typeof item === "object" && item !== null
          ? resolveObjectVariables(item as Record<string, unknown>, context)
          : item
      );
    } else if (typeof value === "object" && value !== null) {
      result[key] = resolveObjectVariables(
        value as Record<string, unknown>,
        context
      );
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Get a value from a nested path in the context.
 * 
 * Supported prefixes:
 * - trigger.* - Access trigger data
 * - lead.* - Access lead data
 * - conversation.* - Access conversation data
 * - variables.* - Access execution variables
 * - node.{nodeId}.* - Access output from a specific node
 */
function getValueFromPath(
  path: string,
  context: ExecutionContext
): unknown {
  const parts = path.split(".");
  const prefix = parts[0];
  const rest = parts.slice(1);
  
  let source: unknown;
  
  switch (prefix) {
    case "trigger":
      source = context.triggerData;
      break;
    case "lead":
      source = context.triggerData.lead || context.variables.lead;
      break;
    case "conversation":
      source = context.triggerData.conversation || context.variables.conversation;
      break;
    case "variables":
      source = context.variables;
      break;
    case "node":
      // node.{nodeId}.output
      const nodeId = rest[0];
      const nodeResult = context.nodesExecuted.find((n) => n.nodeId === nodeId);
      source = nodeResult?.output;
      rest.shift(); // Remove nodeId from path
      break;
    case "env":
      // Environment variables (limited set)
      source = {
        timestamp: new Date().toISOString(),
        execution_id: context.executionId,
        automation_id: context.automationId,
      };
      break;
    default:
      // Try direct variable lookup
      source = context.variables[prefix];
      if (source === undefined) {
        // Try trigger data as fallback
        source = context.triggerData[prefix];
      }
  }
  
  // Navigate the rest of the path
  return navigatePath(source, rest);
}

/**
 * Navigate a nested path in an object.
 */
function navigatePath(obj: unknown, path: string[]): unknown {
  if (path.length === 0 || obj === undefined || obj === null) {
    return obj;
  }
  
  const [current, ...rest] = path;
  
  if (typeof obj === "object" && obj !== null) {
    const value = (obj as Record<string, unknown>)[current];
    return navigatePath(value, rest);
  }
  
  return undefined;
}

/**
 * Extract all variable references from a template string.
 */
export function extractVariableReferences(template: string): string[] {
  const matches = template.matchAll(VARIABLE_PATTERN);
  return Array.from(matches, (m) => m[1].trim());
}

/**
 * Check if a string contains any template variables.
 */
export function containsVariables(template: string): boolean {
  return VARIABLE_PATTERN.test(template);
}
