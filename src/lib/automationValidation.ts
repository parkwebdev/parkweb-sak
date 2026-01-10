/**
 * Automation Validation
 * 
 * Validation rules and utilities for automation nodes.
 * Ensures automations are complete before publishing.
 * 
 * @module lib/automationValidation
 */

import type { AutomationNode, AutomationEdge, AutomationNodeType } from '@/types/automations';

// ============================================================================
// Types
// ============================================================================

export interface ValidationError {
  nodeId: string;
  nodeLabel: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  message: string;
  severity?: 'error' | 'warning';
}

// ============================================================================
// Validation Rules by Node Type
// ============================================================================

const NODE_VALIDATION_RULES: Partial<Record<AutomationNodeType, ValidationRule[]>> = {
  // Triggers
  'trigger-event': [
    { field: 'event', required: true, message: 'Select an event to trigger on' },
  ],
  'trigger-schedule': [
    { field: 'cronExpression', required: true, message: 'Set a schedule (cron expression)' },
  ],
  'trigger-ai-tool': [
    { field: 'toolName', required: true, message: 'Enter a tool name' },
    { field: 'toolDescription', required: true, message: 'Describe what this tool does' },
  ],
  // trigger-manual has no required fields

  // Actions
  'action-email': [
    { field: 'to', required: true, message: 'Select a recipient' },
    { field: 'subject', required: true, message: 'Enter an email subject' },
    { field: 'body', required: true, message: 'Enter email content' },
  ],
  'action-http': [
    { field: 'url', required: true, message: 'Enter a URL' },
    { field: 'method', required: true, message: 'Select an HTTP method' },
  ],
  'action-update-lead': [
    { field: 'fields', minLength: 1, message: 'Add at least one field to update' },
  ],

  // Logic
  'logic-condition': [
    { field: 'condition.field', required: true, message: 'Select a field to check' },
    { field: 'condition.operator', required: true, message: 'Select a condition operator' },
  ],
  'logic-delay': [
    { field: 'delayMs', required: true, message: 'Set a delay duration' },
  ],
  // logic-stop has no required fields

  // Transform
  'transform-set-variable': [
    { field: 'variableName', required: true, message: 'Enter a variable name' },
    { field: 'valueExpression', required: true, message: 'Enter a value expression' },
  ],

  // AI
  'ai-generate': [
    { field: 'prompt', required: true, message: 'Enter a prompt' },
    { field: 'outputVariable', required: true, message: 'Name the output variable' },
  ],
  'ai-classify': [
    { field: 'input', required: true, message: 'Select what to classify' },
    { field: 'categories', minLength: 2, message: 'Add at least 2 categories' },
    { field: 'outputVariable', required: true, message: 'Name the output variable' },
  ],
  'ai-extract': [
    { field: 'input', required: true, message: 'Select what to extract from' },
    { field: 'fields', minLength: 1, message: 'Add at least one field to extract' },
    { field: 'outputVariable', required: true, message: 'Name the output variable' },
  ],
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Get a nested field value from an object using dot notation.
 * E.g., getNestedValue({ condition: { field: 'test' } }, 'condition.field') => 'test'
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Check if a value is considered "empty" for validation purposes.
 */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Validate a single node against its rules.
 */
export function validateNode(node: AutomationNode): ValidationError[] {
  const errors: ValidationError[] = [];
  const rules = NODE_VALIDATION_RULES[node.type];
  
  if (!rules) {
    return errors; // No rules = valid
  }

  const data = node.data as Record<string, unknown>;
  const nodeLabel = (data.label as string) || node.type;

  for (const rule of rules) {
    const value = getNestedValue(data, rule.field);
    
    // Check required
    if (rule.required && isEmpty(value)) {
      errors.push({
        nodeId: node.id,
        nodeLabel,
        field: rule.field,
        message: rule.message,
        severity: rule.severity || 'error',
      });
      continue;
    }

    // Check minLength
    if (rule.minLength !== undefined && Array.isArray(value)) {
      if (value.length < rule.minLength) {
        errors.push({
          nodeId: node.id,
          nodeLabel,
          field: rule.field,
          message: rule.message,
          severity: rule.severity || 'error',
        });
      }
    }
  }

  return errors;
}

/**
 * Validate an entire automation flow.
 */
export function validateAutomation(
  nodes: AutomationNode[], 
  _edges: AutomationEdge[]
): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate each node
  for (const node of nodes) {
    const nodeErrors = validateNode(node);
    allErrors.push(...nodeErrors);
  }

  // Separate errors and warnings
  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get human-readable summary of validation issues.
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid) return 'All nodes configured correctly';
  
  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;
  
  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount === 1 ? '' : 's'}`);
  }
  
  return parts.join(', ');
}
