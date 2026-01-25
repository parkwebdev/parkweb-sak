/**
 * Prompt Validation Schemas
 * 
 * Zod schemas for validating prompt configurations.
 * 
 * @module lib/prompt-validation
 */

import { z } from 'zod';

/** Maximum characters allowed in a prompt section */
export const MAX_PROMPT_CHARS = 10000;

/** Warning threshold for prompt length */
export const WARN_PROMPT_CHARS = 8000;

/** Minimum characters for a valid prompt */
export const MIN_PROMPT_CHARS = 10;

/**
 * Base prompt validation schema.
 */
export const promptContentSchema = z
  .string()
  .min(MIN_PROMPT_CHARS, `Prompt must be at least ${MIN_PROMPT_CHARS} characters`)
  .max(MAX_PROMPT_CHARS, `Prompt exceeds ${MAX_PROMPT_CHARS.toLocaleString()} character limit`)
  .refine(
    (val) => {
      // Check for unclosed template variables
      const openBraces = (val.match(/\{\{/g) || []).length;
      const closeBraces = (val.match(/\}\}/g) || []).length;
      return openBraces === closeBraces;
    },
    'Unclosed template variables detected ({{ without matching }})'
  );

/**
 * Identity prompt validation - requires certain key elements.
 */
export const identityPromptSchema = promptContentSchema.refine(
  (val) => {
    const lowered = val.toLowerCase();
    return lowered.includes('you are') || lowered.includes('your role');
  },
  'Identity prompt should define who the AI is (e.g., "You are...")'
);

/**
 * Formatting rules validation.
 */
export const formattingPromptSchema = promptContentSchema;

/**
 * Security guardrails validation.
 */
export const securityPromptSchema = promptContentSchema.refine(
  (val) => {
    const lowered = val.toLowerCase();
    return lowered.includes('never') || lowered.includes('do not');
  },
  'Security prompt should include restrictions (e.g., "NEVER...", "Do not...")'
);

/**
 * Language instruction validation.
 */
export const languagePromptSchema = z
  .string()
  .min(5, 'Language instruction must be at least 5 characters')
  .max(MAX_PROMPT_CHARS, `Language instruction exceeds ${MAX_PROMPT_CHARS.toLocaleString()} character limit`);

/**
 * Validate a prompt section and return errors.
 */
export function validatePromptSection(
  section: 'identity' | 'formatting' | 'security' | 'language',
  value: string
): { valid: boolean; error?: string } {
  const schemas = {
    identity: identityPromptSchema,
    formatting: formattingPromptSchema,
    security: securityPromptSchema,
    language: languagePromptSchema,
  };

  const result = schemas[section].safeParse(value);
  
  if (result.success) {
    return { valid: true };
  }
  
  return { 
    valid: false, 
    error: result.error.errors[0]?.message || 'Invalid prompt' 
  };
}

/**
 * Estimate token count from character count.
 * Rough approximation: ~4 characters per token for English text.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get prompt length status for UI indicators.
 */
export function getPromptLengthStatus(
  length: number
): 'ok' | 'warning' | 'error' {
  if (length >= MAX_PROMPT_CHARS) return 'error';
  if (length >= WARN_PROMPT_CHARS) return 'warning';
  return 'ok';
}
