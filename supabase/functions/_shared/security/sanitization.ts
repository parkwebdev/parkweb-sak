/**
 * Output Sanitization
 * Redacts sensitive information from AI responses.
 * 
 * @module _shared/security/sanitization
 * @description Provides regex-based pattern matching to redact secrets and credentials.
 * 
 * @example
 * ```typescript
 * import { sanitizeAiOutput } from "../_shared/security/sanitization.ts";
 * 
 * const { sanitized, redactionsApplied } = sanitizeAiOutput(aiResponse);
 * if (redactionsApplied > 0) {
 *   logger.warn('Redacted sensitive content', { count: redactionsApplied });
 * }
 * ```
 */

// ============================================
// BLOCKED PATTERNS
// ============================================

interface BlockedPattern {
  pattern: RegExp;
  replacement: string;
}

/**
 * Output sanitization patterns - redact sensitive information from AI responses.
 * These patterns catch common secrets, keys, and prompt leakage attempts.
 */
export const BLOCKED_PATTERNS: BlockedPattern[] = [
  { pattern: /system prompt/gi, replacement: '[information]' },
  { pattern: /my instructions/gi, replacement: '[my purpose]' },
  { pattern: /my (configuration|config|settings)/gi, replacement: '[my purpose]' },
  { pattern: /SUPABASE_[A-Z_]+/gi, replacement: '[REDACTED]' },
  { pattern: /OPENROUTER_[A-Z_]+/gi, replacement: '[REDACTED]' },
  { pattern: /API_KEY/gi, replacement: '[REDACTED]' },
  { pattern: /sk[-_]live[-_][a-zA-Z0-9]+/gi, replacement: '[REDACTED]' },
  { pattern: /sk[-_]test[-_][a-zA-Z0-9]+/gi, replacement: '[REDACTED]' },
  { pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/gi, replacement: '[REDACTED]' }, // JWTs
];

// ============================================
// SANITIZATION FUNCTION
// ============================================

export interface SanitizationResult {
  sanitized: string;
  redactionsApplied: number;
}

/**
 * Sanitize AI output to prevent accidental leakage of sensitive information.
 * Applies regex-based pattern matching to redact secrets, prompts, and credentials.
 * 
 * @param content - AI-generated content to sanitize
 * @returns Object with sanitized content and count of redactions applied
 */
export function sanitizeAiOutput(content: string): SanitizationResult {
  let sanitized = content;
  let redactionsApplied = 0;
  
  for (const { pattern, replacement } of BLOCKED_PATTERNS) {
    const matches = sanitized.match(pattern);
    if (matches) {
      redactionsApplied += matches.length;
      sanitized = sanitized.replace(pattern, replacement);
    }
  }
  
  return { sanitized, redactionsApplied };
}
