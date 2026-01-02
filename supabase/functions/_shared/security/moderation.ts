/**
 * Content Moderation
 * OpenAI Moderation API integration for content safety.
 * 
 * @module _shared/security/moderation
 * @description Provides content moderation using OpenAI's moderation endpoint.
 * 
 * @example
 * ```typescript
 * import { moderateContent } from "../_shared/security/moderation.ts";
 * 
 * const result = await moderateContent("user message here");
 * if (result.action === 'block') {
 *   return errorResponse("Content not allowed");
 * }
 * ```
 */

// ============================================
// MODERATION TYPES
// ============================================

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  severity: 'low' | 'medium' | 'high';
  action: 'allow' | 'warn' | 'block';
}

// ============================================
// SEVERITY CATEGORIES
// ============================================

/** Categories that warrant immediate blocking */
export const HIGH_SEVERITY_CATEGORIES = [
  'sexual/minors',
  'violence/graphic',
  'self-harm/intent',
  'self-harm/instructions',
];

/** Categories that warrant warnings */
export const MEDIUM_SEVERITY_CATEGORIES = [
  'hate/threatening',
  'violence',
  'self-harm',
];

// ============================================
// MODERATION FUNCTION
// ============================================

/**
 * Content moderation using OpenAI Moderation API.
 * Used as a safety layer regardless of which LLM is used for chat.
 * 
 * Fails open (allows content) if:
 * - OPENAI_API_KEY is not configured
 * - API call fails or returns error
 * 
 * @param content - Content to moderate
 * @returns ModerationResult with flagged status, categories, severity, and action
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  
  // If no OpenAI key, fail open (allow content but log warning)
  if (!openaiKey) {
    console.warn('OPENAI_API_KEY not configured - skipping content moderation');
    return { flagged: false, categories: [], severity: 'low', action: 'allow' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        input: content,
        model: 'omni-moderation-latest' 
      }),
    });

    if (!response.ok) {
      console.error('Moderation API error:', response.status);
      // Fail open on API errors
      return { flagged: false, categories: [], severity: 'low', action: 'allow' };
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) {
      console.warn('No moderation result returned');
      return { flagged: false, categories: [], severity: 'low', action: 'allow' };
    }

    const flaggedCategories = Object.entries(result.categories || {})
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);

    // Determine severity based on flagged categories
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (flaggedCategories.some(c => HIGH_SEVERITY_CATEGORIES.includes(c))) {
      severity = 'high';
    } else if (flaggedCategories.some(c => MEDIUM_SEVERITY_CATEGORIES.includes(c))) {
      severity = 'medium';
    }

    return {
      flagged: result.flagged || false,
      categories: flaggedCategories,
      severity,
      action: severity === 'high' ? 'block' : severity === 'medium' ? 'warn' : 'allow',
    };
  } catch (error) {
    console.error('Moderation API call failed:', error);
    // Fail open on exceptions
    return { flagged: false, categories: [], severity: 'low', action: 'allow' };
  }
}
