/**
 * URL Stripper Utility
 * Removes raw URLs from message content when link previews are displayed
 */

// URL regex that matches http/https URLs
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

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
  /Here(?:'s| is) (?:the )?(?:link|more info(?:rmation)?):\s*/gi,
  /View (?:it |details )?here:\s*/gi,
  /Click here(?:\s+to\s+\w+)?:\s*/gi,
];

/**
 * Strips URLs and associated phrases from message content when link previews are available.
 * This prevents duplicate display of URLs (both as text and as rich preview cards).
 */
export function stripUrlsFromContent(content: string, stripUrls: boolean): string {
  if (!stripUrls) return content;
  
  let cleaned = content;
  
  // Remove URLs
  cleaned = cleaned.replace(URL_REGEX, '');
  
  // Remove orphaned link phrases
  LINK_PHRASES.forEach(phrase => {
    cleaned = cleaned.replace(phrase, '');
  });
  
  // Clean up trailing colons left after URL removal
  cleaned = cleaned.replace(/:\s*$/gm, '');
  cleaned = cleaned.replace(/:\s*\n/g, '\n');
  
  // Clean up formatting artifacts
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')       // Multiple spaces → single space
    .replace(/\n{3,}/g, '\n\n')    // Multiple newlines → max 2
    .replace(/\n\s+\n/g, '\n\n')   // Lines with only whitespace
    .replace(/^\s+|\s+$/g, '')     // Trim start/end
    .replace(/\n+$/g, '')          // Trailing newlines
    .replace(/^\n+/g, '');         // Leading newlines
  
  return cleaned;
}
