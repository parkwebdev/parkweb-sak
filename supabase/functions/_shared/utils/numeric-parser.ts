/**
 * Numeric Field Parsing Utilities
 * Handles beds, baths, square footage, year built with various formats.
 * 
 * @module _shared/utils/numeric-parser
 */

/**
 * Parse bedroom count from various formats.
 * 
 * Handles:
 * - "3" → 3
 * - "3 bed" → 3
 * - "3BR" → 3
 * - "Studio" → 0
 * 
 * @param input - Bedroom value in any format
 * @returns Number of bedrooms or null
 */
export function parseBedCount(input: unknown): number | null {
  if (input == null) return null;
  
  if (typeof input === 'number') {
    return isNaN(input) || input < 0 ? null : Math.floor(input);
  }
  
  const str = String(input).toLowerCase().trim();
  if (!str) return null;
  
  // Handle studio apartments
  if (str.includes('studio') || str === '0') {
    return 0;
  }
  
  // Extract the first number
  const match = str.match(/(\d+)/);
  if (!match) return null;
  
  const num = parseInt(match[1], 10);
  return isNaN(num) || num < 0 ? null : num;
}

/**
 * Parse bathroom count with half-bath handling.
 * 
 * Handles:
 * - "2.5" → 2.5
 * - "2 1/2" → 2.5
 * - "2½" → 2.5
 * - "2.5 bath" → 2.5
 * - "3" → 3
 * - "1 full, 1 half" → 1.5
 * 
 * @param input - Bathroom value in any format
 * @returns Number of bathrooms or null
 */
export function parseBathCount(input: unknown): number | null {
  if (input == null) return null;
  
  if (typeof input === 'number') {
    return isNaN(input) || input < 0 ? null : input;
  }
  
  const str = String(input).trim();
  if (!str) return null;
  
  // Handle Unicode half symbol (½)
  if (str.includes('½')) {
    const whole = parseInt(str, 10) || 0;
    return whole + 0.5;
  }
  
  // Handle "X 1/2" fraction format
  const fractionMatch = str.match(/(\d+)\s*(?:and\s*)?1\/2/i);
  if (fractionMatch) {
    return parseInt(fractionMatch[1], 10) + 0.5;
  }
  
  // Handle "X full, Y half" format
  const fullHalfMatch = str.match(/(\d+)\s*full[,\s]+(\d+)\s*half/i);
  if (fullHalfMatch) {
    const full = parseInt(fullHalfMatch[1], 10);
    const half = parseInt(fullHalfMatch[2], 10) * 0.5;
    return full + half;
  }
  
  // Handle "X.5" decimal format
  const decimalMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (decimalMatch) {
    const num = parseFloat(decimalMatch[1]);
    return isNaN(num) || num < 0 ? null : num;
  }
  
  return null;
}

/**
 * Parse square footage from various formats.
 * 
 * Handles:
 * - "1500" → 1500
 * - "1,500" → 1500
 * - "1,500 sq ft" → 1500
 * - "1500 sqft" → 1500
 * - "1.5K sq ft" → 1500
 * - "1500 SF" → 1500
 * 
 * @param input - Square footage value in any format
 * @returns Square footage as integer or null
 */
export function parseSqft(input: unknown): number | null {
  if (input == null) return null;
  
  if (typeof input === 'number') {
    return isNaN(input) || input < 0 ? null : Math.round(input);
  }
  
  const str = String(input).trim();
  if (!str) return null;
  
  // Handle "XK" format (e.g., "1.5K")
  const kMatch = str.match(/(\d+(?:\.\d+)?)\s*[Kk]/);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1000);
  }
  
  // Remove commas and common suffixes
  const cleaned = str
    .replace(/,/g, '')
    .replace(/sq\.?\s*ft\.?/gi, '')
    .replace(/square\s*feet/gi, '')
    .replace(/sqft/gi, '')
    .replace(/sf/gi, '')
    .trim();
  
  // Extract number
  const match = cleaned.match(/(\d+)/);
  if (!match) return null;
  
  const num = parseInt(match[1], 10);
  return isNaN(num) || num < 0 ? null : num;
}

/**
 * Parse year built with validation for reasonable range.
 * 
 * Handles:
 * - "2020" → 2020
 * - "Built in 2020" → 2020
 * - "1890" → 1890 (historic homes)
 * - "2025" → 2025 (new construction)
 * 
 * @param input - Year value in any format
 * @returns 4-digit year or null if invalid
 */
export function parseYearBuilt(input: unknown): number | null {
  if (input == null) return null;
  
  if (typeof input === 'number') {
    const currentYear = new Date().getFullYear();
    // Reasonable range: 1800 to next year (for new construction)
    if (isNaN(input) || input < 1800 || input > currentYear + 1) {
      return null;
    }
    return Math.floor(input);
  }
  
  const str = String(input).trim();
  if (!str) return null;
  
  // Extract 4-digit year
  const match = str.match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
  if (!match) return null;
  
  const year = parseInt(match[1], 10);
  const currentYear = new Date().getFullYear();
  
  if (isNaN(year) || year < 1800 || year > currentYear + 1) {
    return null;
  }
  
  return year;
}

/**
 * Parse lot rent from various formats (returns cents).
 * 
 * Handles:
 * - "850" → 85000
 * - "$850" → 85000
 * - "$850/mo" → 85000
 * - "850.00" → 85000
 * 
 * @param input - Lot rent value in any format
 * @returns Lot rent in cents or null
 */
export function parseLotRent(input: unknown): number | null {
  if (input == null) return null;
  
  if (typeof input === 'number') {
    if (isNaN(input) || input < 0) return null;
    return Math.round(input * 100);
  }
  
  const str = String(input).trim();
  if (!str) return null;
  
  // Remove currency symbol, commas, and suffixes
  const cleaned = str
    .replace(/[$,]/g, '')
    .replace(/\/(mo|month|mon)\.?/gi, '')
    .replace(/per\s*month/gi, '')
    .trim();
  
  // Extract numeric value with optional decimal
  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  
  const dollars = parseFloat(match[1]);
  if (isNaN(dollars) || dollars < 0) return null;
  
  return Math.round(dollars * 100);
}

/**
 * Parse a generic integer from various formats.
 * 
 * @param input - Numeric value in any format
 * @returns Integer or null
 */
export function parseInteger(input: unknown): number | null {
  if (input == null) return null;
  
  if (typeof input === 'number') {
    return isNaN(input) ? null : Math.floor(input);
  }
  
  const str = String(input).replace(/[,\s]/g, '').trim();
  if (!str) return null;
  
  const match = str.match(/-?\d+/);
  if (!match) return null;
  
  const num = parseInt(match[0], 10);
  return isNaN(num) ? null : num;
}

/**
 * Parse a generic decimal number from various formats.
 * 
 * @param input - Numeric value in any format
 * @returns Float or null
 */
export function parseDecimal(input: unknown): number | null {
  if (input == null) return null;
  
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }
  
  const str = String(input).replace(/[,\s]/g, '').trim();
  if (!str) return null;
  
  const match = str.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}
