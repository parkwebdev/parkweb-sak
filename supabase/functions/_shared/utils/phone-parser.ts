/**
 * Phone Number Parsing Utilities
 * Normalizes various phone number formats to E.164 standard.
 * 
 * @module _shared/utils/phone-parser
 */

/**
 * Normalize a phone number to E.164 format for US numbers.
 * 
 * Handles:
 * - "(602) 555-1234" → "+16025551234"
 * - "602.555.1234" → "+16025551234"
 * - "602-555-1234" → "+16025551234"
 * - "1-800-555-1234" → "+18005551234"
 * - "6025551234" → "+16025551234"
 * - "555-1234" → null (incomplete, needs area code)
 * 
 * @param input - Phone number in any format
 * @returns E.164 formatted number or null if invalid
 */
export function normalizePhoneNumber(input: string | null): string | null {
  if (!input) return null;
  
  const trimmed = input.trim();
  if (!trimmed) return null;
  
  // Extract digits only
  const digits = trimmed.replace(/\D/g, '');
  
  // Handle various lengths
  if (digits.length === 10) {
    // Standard US number without country code
    return `+1${digits}`;
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    // US number with country code
    return `+${digits}`;
  }
  
  if (digits.length === 7) {
    // Local number without area code - can't convert to E.164
    return null;
  }
  
  if (digits.length < 10) {
    // Too short to be valid
    return null;
  }
  
  // For international numbers or longer formats, just prefix with +
  if (digits.length > 11) {
    return `+${digits}`;
  }
  
  return null;
}

/**
 * Format a phone number for display.
 * 
 * @param e164Number - E.164 formatted number (e.g., "+16025551234")
 * @returns Human-readable format (e.g., "(602) 555-1234")
 */
export function formatPhoneForDisplay(e164Number: string | null): string | null {
  if (!e164Number) return null;
  
  // Remove the + and country code for US numbers
  const digits = e164Number.replace(/\D/g, '');
  
  if (digits.length === 11 && digits.startsWith('1')) {
    // US number
    const area = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7, 11);
    return `(${area}) ${prefix}-${line}`;
  }
  
  if (digits.length === 10) {
    // US number without country code
    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6, 10);
    return `(${area}) ${prefix}-${line}`;
  }
  
  // Return as-is for non-US numbers
  return e164Number;
}

/**
 * Extract a phone number from text that may contain other content.
 * 
 * @param text - Text that may contain a phone number
 * @returns Extracted phone number or null
 */
export function extractPhoneFromText(text: string | null): string | null {
  if (!text) return null;
  
  // Common phone patterns
  const patterns = [
    // (XXX) XXX-XXXX
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    // 1-XXX-XXX-XXXX
    /1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
    // XXX-XXX-XXXX
    /\d{3}[-.\s]\d{3}[-.\s]\d{4}/,
    // XXXXXXXXXX (10 digits)
    /\b\d{10}\b/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizePhoneNumber(match[0]);
    }
  }
  
  return null;
}

/**
 * Check if a string looks like a valid phone number.
 * 
 * @param input - String to check
 * @returns true if it appears to be a phone number
 */
export function isPhoneNumber(input: string | null): boolean {
  if (!input) return false;
  
  // Extract digits
  const digits = input.replace(/\D/g, '');
  
  // Must have 10-11 digits for US numbers
  if (digits.length < 10 || digits.length > 11) {
    return false;
  }
  
  // If 11 digits, must start with 1
  if (digits.length === 11 && !digits.startsWith('1')) {
    return false;
  }
  
  return true;
}
