/**
 * Phone Number Extraction & Formatting
 * Extracts and formats US phone numbers from text content.
 * 
 * @module _shared/utils/phone
 * @description Provides phone number extraction for call buttons in chat responses.
 * 
 * @example
 * ```typescript
 * import { extractPhoneNumbers } from "../_shared/utils/phone.ts";
 * 
 * const callActions = extractPhoneNumbers(
 *   "Call us at (555) 123-4567",
 *   { name: "Main Office", phone: "555-123-4567" }
 * );
 * ```
 */

import { type CallAction, PHONE_REGEX } from "../types.ts";

/**
 * Extract phone numbers from content and format for call buttons.
 * Returns up to 3 phone numbers with proper E.164 formatting.
 * 
 * @param content - Text content to extract phone numbers from
 * @param locationContext - Optional location info for context matching
 * @returns Array of CallAction objects (max 3)
 */
export function extractPhoneNumbers(
  content: string, 
  locationContext?: { name?: string; phone?: string }
): CallAction[] {
  const matches: CallAction[] = [];
  const seenNumbers = new Set<string>();
  
  // Reset regex lastIndex to avoid stale state from previous invocations
  PHONE_REGEX.lastIndex = 0;
  
  let match;
  while ((match = PHONE_REGEX.exec(content)) !== null) {
    const rawNumber = match[0].replace(/[^0-9+]/g, ''); // Strip to digits
    const normalizedNumber = rawNumber.startsWith('+') ? rawNumber : rawNumber.replace(/^1/, '');
    
    // Avoid duplicates
    if (seenNumbers.has(normalizedNumber)) continue;
    seenNumbers.add(normalizedNumber);
    
    // Format display number as (xxx) xxx-xxxx
    const areaCode = match[1];
    const prefix = match[2];
    const line = match[3];
    const displayNumber = `(${areaCode}) ${prefix}-${line}`;
    
    // Check if this matches the location phone for context
    let locationName: string | undefined;
    if (locationContext?.phone) {
      const locationNormalized = locationContext.phone.replace(/[^0-9]/g, '').replace(/^1/, '');
      if (normalizedNumber === locationNormalized || normalizedNumber.endsWith(locationNormalized)) {
        locationName = locationContext.name;
      }
    }
    
    matches.push({
      phoneNumber: rawNumber.startsWith('+') ? rawNumber : `+1${normalizedNumber}`,
      displayNumber,
      locationName,
    });
  }
  
  return matches.slice(0, 3); // Max 3 call buttons
}
