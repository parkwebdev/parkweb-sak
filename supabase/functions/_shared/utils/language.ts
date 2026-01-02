/**
 * Language Detection Utilities
 * AI-powered language detection for multilingual support.
 * 
 * @module _shared/utils/language
 * @description Detects non-English languages in user messages for translation prompts.
 * 
 * @example
 * ```typescript
 * import { detectConversationLanguage, LANGUAGE_NAMES } from "../_shared/utils/language.ts";
 * 
 * const result = await detectConversationLanguage(userMessages, apiKey);
 * if (result) {
 *   console.log(`Detected: ${result.name} (${result.code})`);
 * }
 * ```
 */

// ============================================
// LANGUAGE MAPPING
// ============================================

/**
 * Language detection mapping for common languages.
 * Maps ISO 639-1 two-letter codes to full language names.
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'pt': 'Portuguese',
  'it': 'Italian',
  'nl': 'Dutch',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'pl': 'Polish',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'el': 'Greek',
  'he': 'Hebrew',
  'hu': 'Hungarian',
  'id': 'Indonesian',
  'ms': 'Malay',
  'ro': 'Romanian',
  'uk': 'Ukrainian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'sr': 'Serbian',
  'ca': 'Catalan',
  'tl': 'Tagalog',
};

// ============================================
// DETECTION RESULT TYPE
// ============================================

export interface LanguageDetectionResult {
  code: string;
  name: string;
}

// ============================================
// DETECTION FUNCTION
// ============================================

/**
 * Detect the language of user messages using AI.
 * Returns the ISO language code and full name, or null if English or detection fails.
 * Only detects if user has sent substantive messages (not just greetings).
 * 
 * Uses heuristics first to avoid expensive AI calls for obvious English text.
 * 
 * @param userMessages - Array of user message strings
 * @param openRouterApiKey - OpenRouter API key for AI detection
 * @returns Language code and name, or null if English/detection fails
 */
export async function detectConversationLanguage(
  userMessages: string[],
  openRouterApiKey: string
): Promise<LanguageDetectionResult | null> {
  // Need at least some text to detect
  const allUserText = userMessages.join(' ').trim();
  if (allUserText.length < 10) return null;
  
  // Quick heuristic check for common non-English characters
  const hasNonLatinChars = /[\u0400-\u04FF\u0600-\u06FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0E00-\u0E7F]/.test(allUserText);
  const hasSpanishChars = /[¿¡ñáéíóúü]/i.test(allUserText);
  const hasFrenchChars = /[àâäéèêëïîôùûüÿç]/i.test(allUserText);
  const hasGermanChars = /[äöüß]/i.test(allUserText);
  
  // If text appears to be plain ASCII English, skip detection
  if (!hasNonLatinChars && !hasSpanishChars && !hasFrenchChars && !hasGermanChars) {
    // Additional check: if text is very short and looks like English common words, skip
    const lowerText = allUserText.toLowerCase();
    const englishWords = ['hello', 'hi', 'help', 'thanks', 'please', 'what', 'how', 'when', 'where', 'yes', 'no', 'the', 'and', 'is', 'are'];
    const wordCount = allUserText.split(/\s+/).length;
    const englishWordCount = englishWords.filter(w => lowerText.includes(w)).length;
    
    // If short text with English words, likely English - skip expensive AI call
    if (wordCount <= 20 && englishWordCount >= 2) {
      return null;
    }
  }
  
  try {
    // Use fast/cheap model for detection
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://getpilot.io',
        'X-Title': 'Pilot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You are a language detector. Respond with ONLY the ISO 639-1 two-letter language code (e.g., "es" for Spanish, "fr" for French, "en" for English). No other text.',
          },
          {
            role: 'user',
            content: `Detect the language of this text: "${allUserText.substring(0, 500)}"`,
          },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });
    
    if (!response.ok) {
      console.error('Language detection API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    const detectedCode = (data.choices?.[0]?.message?.content || '').trim().toLowerCase().replace(/[^a-z]/g, '').substring(0, 2);
    
    if (!detectedCode || detectedCode === 'en') {
      return null; // English or failed detection
    }
    
    const languageName = LANGUAGE_NAMES[detectedCode] || detectedCode.toUpperCase();
    console.log(`Detected language: ${detectedCode} (${languageName})`);
    
    return { code: detectedCode, name: languageName };
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
}
