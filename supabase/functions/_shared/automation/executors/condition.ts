/**
 * Condition Node Executor
 * Evaluates conditions and determines branching.
 * 
 * @module _shared/automation/executors/condition
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { resolveVariables } from "../variable-resolver.ts";

interface ConditionGroup {
  logic: "and" | "or";
  conditions: Condition[];
}

interface Condition {
  field: string;
  operator: string;
  value: string;
}

export async function executeConditionNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as {
    groups?: ConditionGroup[];
    groupLogic?: "and" | "or";
  };
  
  if (!data.groups || data.groups.length === 0) {
    // No conditions = always true
    return {
      success: true,
      branch: "true",
      output: { evaluated: true, reason: "No conditions defined" },
    };
  }
  
  try {
    const groupResults = data.groups.map((group) => evaluateGroup(group, context));
    
    // Combine group results based on groupLogic
    const result =
      data.groupLogic === "or"
        ? groupResults.some((r) => r)
        : groupResults.every((r) => r);
    
    console.log(
      `Condition evaluated: ${result} (groups: ${groupResults.join(", ")})`
    );
    
    return {
      success: true,
      branch: result ? "true" : "false",
      output: {
        evaluated: result,
        groupResults,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Condition evaluation failed: ${error}`,
    };
  }
}

function evaluateGroup(group: ConditionGroup, context: ExecutionContext): boolean {
  if (!group.conditions || group.conditions.length === 0) {
    return true;
  }
  
  const results = group.conditions.map((c) => evaluateCondition(c, context));
  
  return group.logic === "or"
    ? results.some((r) => r)
    : results.every((r) => r);
}

function evaluateCondition(condition: Condition, context: ExecutionContext): boolean {
  // Resolve the field value (may be a variable reference)
  const fieldValue = resolveVariables(`{{${condition.field}}}`, context);
  const compareValue = resolveVariables(condition.value, context);
  
  // Parse as JSON if possible for proper comparison
  let parsedFieldValue: unknown = fieldValue;
  let parsedCompareValue: unknown = compareValue;
  
  try {
    if (fieldValue.startsWith("{") || fieldValue.startsWith("[")) {
      parsedFieldValue = JSON.parse(fieldValue);
    }
  } catch {
    // Keep as string
  }
  
  try {
    if (compareValue.startsWith("{") || compareValue.startsWith("[")) {
      parsedCompareValue = JSON.parse(compareValue);
    }
  } catch {
    // Keep as string
  }
  
  switch (condition.operator) {
    case "equals":
    case "eq":
      return String(parsedFieldValue) === String(parsedCompareValue);
    
    case "not_equals":
    case "neq":
      return String(parsedFieldValue) !== String(parsedCompareValue);
    
    case "contains":
      return String(parsedFieldValue)
        .toLowerCase()
        .includes(String(parsedCompareValue).toLowerCase());
    
    case "not_contains":
      return !String(parsedFieldValue)
        .toLowerCase()
        .includes(String(parsedCompareValue).toLowerCase());
    
    case "starts_with":
      return String(parsedFieldValue)
        .toLowerCase()
        .startsWith(String(parsedCompareValue).toLowerCase());
    
    case "ends_with":
      return String(parsedFieldValue)
        .toLowerCase()
        .endsWith(String(parsedCompareValue).toLowerCase());
    
    case "greater_than":
    case "gt":
      return Number(parsedFieldValue) > Number(parsedCompareValue);
    
    case "greater_than_or_equal":
    case "gte":
      return Number(parsedFieldValue) >= Number(parsedCompareValue);
    
    case "less_than":
    case "lt":
      return Number(parsedFieldValue) < Number(parsedCompareValue);
    
    case "less_than_or_equal":
    case "lte":
      return Number(parsedFieldValue) <= Number(parsedCompareValue);
    
    case "is_empty":
      return (
        parsedFieldValue === null ||
        parsedFieldValue === undefined ||
        parsedFieldValue === "" ||
        (Array.isArray(parsedFieldValue) && parsedFieldValue.length === 0)
      );
    
    case "is_not_empty":
      return (
        parsedFieldValue !== null &&
        parsedFieldValue !== undefined &&
        parsedFieldValue !== "" &&
        !(Array.isArray(parsedFieldValue) && parsedFieldValue.length === 0)
      );
    
    case "is_true":
      return (
        parsedFieldValue === true ||
        parsedFieldValue === "true" ||
        parsedFieldValue === 1
      );
    
    case "is_false":
      return (
        parsedFieldValue === false ||
        parsedFieldValue === "false" ||
        parsedFieldValue === 0
      );
    
    case "matches_regex":
      try {
        const regex = new RegExp(String(parsedCompareValue));
        return regex.test(String(parsedFieldValue));
      } catch {
        return false;
      }
    
    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}
