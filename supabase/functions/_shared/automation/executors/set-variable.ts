/**
 * Set Variable Node Executor
 * Sets or transforms variables in the execution context.
 * 
 * @module _shared/automation/executors/set-variable
 */

import type { AutomationNode, ExecutionContext, NodeExecutorResult } from "../types.ts";
import { resolveVariables } from "../variable-resolver.ts";

interface VariableDefinition {
  name: string;
  value: string;
  type?: "string" | "number" | "boolean" | "json" | "expression";
}

export async function executeSetVariableNode(
  node: AutomationNode,
  context: ExecutionContext,
  _supabase: unknown
): Promise<NodeExecutorResult> {
  const data = node.data as {
    variables?: VariableDefinition[];
  };
  
  if (!data.variables || data.variables.length === 0) {
    return {
      success: true,
      output: { message: "No variables to set" },
    };
  }
  
  const setVariables: Record<string, unknown> = {};
  const errors: string[] = [];
  
  for (const variable of data.variables) {
    if (!variable.name) {
      errors.push("Variable name is required");
      continue;
    }
    
    try {
      const resolvedValue = resolveVariables(variable.value || "", context);
      
      let finalValue: unknown;
      
      switch (variable.type) {
        case "number":
          finalValue = Number(resolvedValue);
          if (isNaN(finalValue as number)) {
            errors.push(`Cannot convert "${resolvedValue}" to number for ${variable.name}`);
            continue;
          }
          break;
        
        case "boolean":
          finalValue =
            resolvedValue === "true" ||
            resolvedValue === "1" ||
            resolvedValue.toLowerCase() === "yes";
          break;
        
        case "json":
          try {
            finalValue = JSON.parse(resolvedValue);
          } catch {
            errors.push(`Invalid JSON for ${variable.name}: ${resolvedValue}`);
            continue;
          }
          break;
        
        case "expression":
          // Simple expression evaluation (safe subset)
          try {
            finalValue = evaluateExpression(resolvedValue, context);
          } catch (e) {
            errors.push(`Expression error for ${variable.name}: ${e}`);
            continue;
          }
          break;
        
        case "string":
        default:
          finalValue = resolvedValue;
      }
      
      setVariables[variable.name] = finalValue;
      console.log(`Set variable: ${variable.name} = ${JSON.stringify(finalValue)}`);
    } catch (error) {
      errors.push(`Error setting ${variable.name}: ${error}`);
    }
  }
  
  if (errors.length > 0 && Object.keys(setVariables).length === 0) {
    return {
      success: false,
      error: errors.join("; "),
    };
  }
  
  return {
    success: true,
    output: {
      variablesSet: Object.keys(setVariables),
      errors: errors.length > 0 ? errors : undefined,
    },
    setVariables,
  };
}

/**
 * Evaluate a simple expression.
 * Supports basic math and string operations.
 */
function evaluateExpression(expr: string, _context: ExecutionContext): unknown {
  // Security: Only allow safe operations
  // Remove any function calls or complex expressions
  const safeExpr = expr
    .replace(/[a-zA-Z_]\w*\s*\(/g, "") // Remove function calls
    .replace(/\[|\]/g, ""); // Remove array access
  
  // Only allow numbers, operators, and parentheses for math
  if (/^[\d\s+\-*/().]+$/.test(safeExpr)) {
    try {
      // Use Function to evaluate math expression safely
      const result = new Function(`return ${safeExpr}`)();
      return result;
    } catch {
      throw new Error(`Invalid math expression: ${safeExpr}`);
    }
  }
  
  // For string concatenation (already resolved by variable resolver)
  return expr;
}
