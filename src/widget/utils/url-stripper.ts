/**
 * Content Stripper Utilities
 * Removes raw URLs and phone numbers from message content when rich previews/buttons are displayed
 */

// URL regex that matches http/https URLs
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// Phone regex matching US phone numbers (same as edge function)
const PHONE_REGEX = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

// Common link phrases that should be removed when URLs are stripped
const LINK_PHRASES = [
  /Learn more:\s*/gi,
  /Read more:\s*/gi,
  /See more:\s*/gi,
  /More details:\s*/gi,
  /More info:\s*/gi,
  /Link:\s*/gi,
  /Visit:\s*/gi,
  /Check out:\s*/gi,
  /For more information:\s*/gi,
  /You can find more here:\s*/gi,
  /You can learn more here:\s*/gi,
];

// Common phone phrases that should be removed when phone numbers are stripped
const PHONE_PHRASES = [
  /call\s+(us\s+)?(at|:)\s*/gi,
  /phone(\s+number)?(\s+is)?:?\s*/gi,
  /reach\s+(us\s+)?(at|:)\s*/gi,
  /contact\s+(us\s+)?(at|:)\s*/gi,
  /dial:?\s*/gi,
  /number(\s+is)?:?\s*/gi,
  /give\s+(us\s+)?a\s+call\s+(at|:)?\s*/gi,
  /their\s+number\s+is:?\s*/gi,
];

/**
 * Cleans up formatting artifacts after stripping content.
 */
function cleanupFormatting(content: string): string {
  return content
    .replace(/\s{2,}/g, ' ')       // Multiple spaces → single space
    .replace(/\n{3,}/g, '\n\n')    // Multiple newlines → max 2
    .replace(/\n\s+\n/g, '\n\n')   // Lines with only whitespace
    .replace(/^\s+|\s+$/g, '')     // Trim start/end
    .replace(/\n+$/g, '')          // Trailing newlines
    .replace(/^\n+/g, '');         // Leading newlines
}

/**
 * Strips URLs and associated phrases from message content when link previews are available.
 * This prevents duplicate display of URLs (both as text and as rich preview cards).
 */
export function stripUrlsFromContent(content: string, hasLinkPreviews: boolean): string {
  if (!hasLinkPreviews) return content;
  
  let cleaned = content;
  
  // Remove URLs
  cleaned = cleaned.replace(URL_REGEX, '');
  
  // Remove orphaned link phrases
  LINK_PHRASES.forEach(phrase => {
    cleaned = cleaned.replace(phrase, '');
  });
  
  return cleanupFormatting(cleaned);
}

/**
 * Strips phone numbers and associated phrases from message content when call buttons are available.
 * This prevents duplicate display of phone numbers (both as text and as call buttons).
 */
export function stripPhoneNumbersFromContent(content: string, hasCallActions: boolean): string {
  if (!hasCallActions) return content;
  
  let cleaned = content;
  
  // Reset regex lastIndex to avoid stale state
  PHONE_REGEX.lastIndex = 0;
  
  // Remove phone numbers
  cleaned = cleaned.replace(PHONE_REGEX, '');
  
  // Remove orphaned phone phrases
  PHONE_PHRASES.forEach(phrase => {
    cleaned = cleaned.replace(phrase, '');
  });
  
  return cleanupFormatting(cleaned);
}
