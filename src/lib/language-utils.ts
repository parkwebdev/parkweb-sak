/**
 * Language utilities for flag display and language name lookup.
 * Shared across frontend components.
 */

export const LANGUAGE_FLAGS: Record<string, string> = {
  'en': '🇺🇸',    // English
  'es': '🇪🇸',    // Spanish
  'pt': '🇵🇹',    // Portuguese
  'pt-BR': '🇧🇷', // Brazilian Portuguese
  'fr': '🇫🇷',    // French
  'de': '🇩🇪',    // German
  'it': '🇮🇹',    // Italian
  'nl': '🇳🇱',    // Dutch
  'pl': '🇵🇱',    // Polish
  'ru': '🇷🇺',    // Russian
  'zh': '🇨🇳',    // Chinese
  'ja': '🇯🇵',    // Japanese
  'ko': '🇰🇷',    // Korean
  'ar': '🇸🇦',    // Arabic
  'he': '🇮🇱',    // Hebrew
  'hi': '🇮🇳',    // Hindi
  'vi': '🇻🇳',    // Vietnamese
  'th': '🇹🇭',    // Thai
  'tr': '🇹🇷',    // Turkish
  'uk': '🇺🇦',    // Ukrainian
  'el': '🇬🇷',    // Greek
  'sv': '🇸🇪',    // Swedish
  'da': '🇩🇰',    // Danish
  'no': '🇳🇴',    // Norwegian
  'fi': '🇫🇮',    // Finnish
  'cs': '🇨🇿',    // Czech
  'ro': '🇷🇴',    // Romanian
  'hu': '🇭🇺',    // Hungarian
  'id': '🇮🇩',    // Indonesian
  'ms': '🇲🇾',    // Malay
  'tl': '🇵🇭',    // Filipino/Tagalog
};

/**
 * Get flag emoji for a language code.
 * Returns globe emoji 🌐 for unknown languages.
 */
export function getLanguageFlag(languageCode: string): string {
  return LANGUAGE_FLAGS[languageCode] || '🌐';
}
