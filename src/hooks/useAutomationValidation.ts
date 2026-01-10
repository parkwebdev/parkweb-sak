/**
 * useAutomationValidation Hook
 * 
 * Provides reactive validation state for the automation flow.
 * Validates nodes and returns errors/warnings with convenience methods.
 * 
 * @module hooks/useAutomationValidation
 */

import { useMemo, useCallback } from 'react';
import { useFlowStore } from '@/stores/automationFlowStore';
import { 
  validateAutomation, 
  type ValidationResult, 
  type ValidationError 
} from '@/lib/automationValidation';

export interface UseAutomationValidationResult {
  /** Whether the automation is valid (no errors) */
  isValid: boolean;
  /** All validation errors */
  errors: ValidationError[];
  /** All validation warnings */
  warnings: ValidationError[];
  /** Count of errors */
  errorCount: number;
  /** Count of warnings */
  warningCount: number;
  /** Get errors for a specific node */
  getNodeErrors: (nodeId: string) => ValidationError[];
  /** Check if a specific node has errors */
  hasNodeErrors: (nodeId: string) => boolean;
  /** Full validation result */
  validationResult: ValidationResult;
}

/**
 * Hook for accessing automation validation state.
 * Re-validates whenever nodes or edges change.
 * 
 * @example
 * ```tsx
 * const { isValid, errors, getNodeErrors } = useAutomationValidation();
 * 
 * // Check overall validity
 * if (!isValid) {
 *   console.log(`${errors.length} errors to fix`);
 * }
 * 
 * // Get errors for specific node
 * const nodeErrors = getNodeErrors('node-123');
 * ```
 */
export function useAutomationValidation(): UseAutomationValidationResult {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  // Memoize validation result - only recalculate when nodes/edges change
  const validationResult = useMemo(() => {
    return validateAutomation(nodes, edges);
  }, [nodes, edges]);

  // Get errors for a specific node
  const getNodeErrors = useCallback((nodeId: string): ValidationError[] => {
    return validationResult.errors.filter(e => e.nodeId === nodeId);
  }, [validationResult.errors]);

  // Check if a specific node has errors
  const hasNodeErrors = useCallback((nodeId: string): boolean => {
    return validationResult.errors.some(e => e.nodeId === nodeId);
  }, [validationResult.errors]);

  return {
    isValid: validationResult.valid,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
    getNodeErrors,
    hasNodeErrors,
    validationResult,
  };
}
