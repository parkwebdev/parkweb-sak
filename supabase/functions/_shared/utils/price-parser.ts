/**
 * Price Parsing Utilities
 * Converts various price formats to cents and infers price types.
 * 
 * @module _shared/utils/price-parser
 */

/**
 * Valid price types for the database enum
 */
export type PriceType = 'sale' | 'rent_monthly' | 'rent_weekly';

/**
 * Parse price from various formats and return value in cents.
 * 
 * Handles:
 * - "$125,000" → 12500000
 * - "125000" → 12500000
 * - "$1,200/mo" → 120000
 * - "$850 per month" → 85000
 * - "1200.00" → 120000
 * - "Call for pricing" → null
 * - "$1.5M" → 150000000
 * - "$1,200.50" → 120050
 * 
 * @param input - Price value in any format
 * @returns Price in cents, or null if invalid
 */
export function parsePriceToCents(input: unknown): number | null {
  if (input == null) return null;
  
  // Handle numeric input directly
  if (typeof input === 'number') {
    if (isNaN(input) || input < 0) return null;
    // If it's a small number (< 100000), assume it's already dollars
    // If it looks like it's already in cents (very large), return as-is
    return Math.round(input * 100);
  }
  
  const str = String(input).trim();
  if (!str) return null;
  
  // Check for non-numeric indicators
  if (/call|contact|inquire|ask|tbd|n\/a|upon request|negotiable/i.test(str)) {
    return null;
  }
  
  // Handle millions shorthand (e.g., "$1.5M", "2M")
  const millionMatch = str.match(/\$?\s*(\d+(?:\.\d+)?)\s*[Mm]/);
  if (millionMatch) {
    const millions = parseFloat(millionMatch[1]);
    return Math.round(millions * 1000000 * 100);
  }
  
  // Handle thousands shorthand (e.g., "$150K", "150k")
  const thousandMatch = str.match(/\$?\s*(\d+(?:\.\d+)?)\s*[Kk]/);
  if (thousandMatch) {
    const thousands = parseFloat(thousandMatch[1]);
    return Math.round(thousands * 1000 * 100);
  }
  
  // Remove currency symbols, commas, and extra whitespace
  const cleaned = str.replace(/[$€£¥,\s]/g, '');
  
  // Remove price type suffixes for parsing
  const withoutSuffix = cleaned.replace(/\/(mo|month|wk|week|yr|year)\.?$/i, '');
  
  // Extract numeric portion with optional decimal
  const match = withoutSuffix.match(/^-?(\d+)(?:\.(\d{1,2}))?/);
  if (!match) return null;
  
  const dollars = parseInt(match[1], 10);
  const cents = match[2] ? parseInt(match[2].padEnd(2, '0'), 10) : 0;
  
  // Sanity check - prices shouldn't be negative
  if (dollars < 0) return null;
  
  return dollars * 100 + cents;
}

/**
 * Infer price type from the raw value string and/or explicit type.
 * 
 * Handles:
 * - "$1,200/mo" → "rent_monthly"
 * - "$800 per week" → "rent_weekly"
 * - "For Sale: $125,000" → "sale"
 * - Explicit type: "rent", "lease", "monthly" → "rent_monthly"
 * 
 * @param rawValue - The original price string
 * @param explicitType - Optional explicit type from a separate field
 * @returns Normalized price type
 */
export function inferPriceType(
  rawValue: unknown, 
  explicitType?: string | null
): PriceType {
  // Check explicit type first if provided
  if (explicitType) {
    const normalized = String(explicitType).toLowerCase().trim();
    
    // Weekly indicators
    if (normalized.includes('week') || normalized === 'weekly') {
      return 'rent_weekly';
    }
    
    // Monthly/rent indicators
    if (
      normalized.includes('rent') || 
      normalized.includes('lease') || 
      normalized.includes('month') ||
      normalized === 'rental' ||
      normalized === 'for rent'
    ) {
      return 'rent_monthly';
    }
    
    // Sale indicators
    if (
      normalized.includes('sale') || 
      normalized.includes('buy') || 
      normalized.includes('purchase') ||
      normalized === 'for sale' ||
      normalized === 'sold'
    ) {
      return 'sale';
    }
  }
  
  // Infer from the value string
  const str = String(rawValue || '').toLowerCase();
  
  // Weekly patterns
  if (/\/\s*w(ee)?k|per\s*week|weekly|\/wk/i.test(str)) {
    return 'rent_weekly';
  }
  
  // Monthly patterns
  if (/\/\s*mo(nth)?|per\s*month|monthly|\/mo|p\/m/i.test(str)) {
    return 'rent_monthly';
  }
  
  // Default to sale for unknown values
  return 'sale';
}

/**
 * Format price for display with appropriate suffix.
 * 
 * @param priceInCents - Price in cents
 * @param priceType - Type of price
 * @returns Formatted price string
 */
export function formatPrice(
  priceInCents: number | null, 
  priceType?: PriceType
): string {
  if (priceInCents === null || priceInCents === undefined) {
    return 'Contact for price';
  }
  
  const price = priceInCents / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  switch (priceType) {
    case 'rent_monthly':
      return `${formatted}/mo`;
    case 'rent_weekly':
      return `${formatted}/wk`;
    default:
      return formatted;
  }
}
