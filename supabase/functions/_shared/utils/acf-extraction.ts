/**
 * ACF Field Extraction Utilities
 * 
 * Handles extraction of values from ACF repeater fields and other complex structures.
 * Used by WordPress sync functions for communities and properties.
 * 
 * @module _shared/utils/acf-extraction
 */

// Common subfield names used in ACF repeaters
const REPEATER_SUBFIELD_NAMES = [
  'amenity', 'feature', 'item', 'value', 'name', 
  'label', 'text', 'title', 'option', 'entry'
];

/**
 * Flatten an ACF repeater array to simple strings.
 * Handles:
 * - Simple string arrays: ["Pool", "Gym"]
 * - Object arrays with known subfields: [{amenity: "Pool"}, {feature: "Gym"}]
 * - Mixed objects with fallback to first string value
 */
export function flattenRepeaterArray(arr: unknown[]): string[] {
  return arr
    .map(item => {
      // Simple string - return as-is
      if (typeof item === 'string') return item;
      
      // Number - convert to string
      if (typeof item === 'number') return String(item);
      
      // Object - try to extract value from known subfields
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        
        // Check common ACF repeater subfield names
        for (const fieldName of REPEATER_SUBFIELD_NAMES) {
          if (fieldName in obj && obj[fieldName] != null) {
            const value = obj[fieldName];
            if (typeof value === 'string' && value.trim()) {
              return value.trim();
            }
            if (typeof value === 'number') {
              return String(value);
            }
          }
        }
        
        // Fallback: use first non-empty string value found
        for (const value of Object.values(obj)) {
          if (typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
      }
      
      return null;
    })
    .filter((v): v is string => v != null && v.trim() !== '');
}

/**
 * Extract an array field from ACF data by checking multiple keywords.
 * Handles repeater objects and simple arrays.
 * 
 * @param acf - The ACF data object
 * @param keywords - Field name keywords to search for (e.g., 'amenities', 'features')
 * @returns Flattened array of strings
 */
export function extractAcfArrayField(
  acf: Record<string, unknown> | undefined,
  ...keywords: string[]
): string[] {
  if (!acf) return [];
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Priority 1: Exact match
    let match = keys.find(k => k.toLowerCase() === lowerKeyword);
    
    // Priority 2: Suffix match (e.g., "community_amenities" ends with "amenities")
    if (!match) {
      match = keys.find(k => k.toLowerCase().endsWith(`_${lowerKeyword}`) || k.toLowerCase().endsWith(lowerKeyword));
    }
    
    // Priority 3: Contains match
    if (!match) {
      match = keys.find(k => k.toLowerCase().includes(lowerKeyword));
    }
    
    if (match) {
      const value = acf[match];
      
      // Handle arrays (repeaters or simple arrays)
      if (Array.isArray(value)) {
        return flattenRepeaterArray(value);
      }
      
      // Handle comma-separated string
      if (typeof value === 'string' && value.includes(',')) {
        return value.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      // Single string value - wrap in array
      if (typeof value === 'string' && value.trim()) {
        return [value.trim()];
      }
    }
  }
  
  return [];
}

/**
 * Extract a single string field from ACF data by checking multiple keywords.
 * 
 * @param acf - The ACF data object
 * @param keywords - Field name keywords to search for
 * @returns The extracted string value or null
 */
export function extractAcfStringField(
  acf: Record<string, unknown> | undefined,
  ...keywords: string[]
): string | null {
  if (!acf) return null;
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Priority 1: Exact match
    let match = keys.find(k => k.toLowerCase() === lowerKeyword);
    
    // Priority 2: Suffix match
    if (!match) {
      match = keys.find(k => k.toLowerCase().endsWith(`_${lowerKeyword}`) || k.toLowerCase().endsWith(lowerKeyword));
    }
    
    // Priority 3: Contains match
    if (!match) {
      match = keys.find(k => k.toLowerCase().includes(lowerKeyword));
    }
    
    if (match) {
      const value = acf[match];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number') {
        return String(value);
      }
    }
  }
  
  return null;
}

/**
 * Extract a numeric field from ACF data by checking multiple keywords.
 * Handles both number values and string numbers (with currency symbols stripped).
 * 
 * @param acf - The ACF data object
 * @param keywords - Field name keywords to search for
 * @returns The extracted number or null
 */
export function extractAcfNumberField(
  acf: Record<string, unknown> | undefined,
  ...keywords: string[]
): number | null {
  if (!acf) return null;
  
  const keys = Object.keys(acf);
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Priority 1: Exact match
    let match = keys.find(k => k.toLowerCase() === lowerKeyword);
    
    // Priority 2: Suffix match
    if (!match) {
      match = keys.find(k => k.toLowerCase().endsWith(`_${lowerKeyword}`) || k.toLowerCase().endsWith(lowerKeyword));
    }
    
    // Priority 3: Contains match
    if (!match) {
      match = keys.find(k => k.toLowerCase().includes(lowerKeyword));
    }
    
    if (match) {
      const value = acf[match];
      if (typeof value === 'number' && !isNaN(value)) {
        return value;
      }
      if (typeof value === 'string') {
        // Strip currency symbols, commas, and other non-numeric characters
        const cleaned = value.replace(/[^0-9.-]/g, '');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed)) return parsed;
      }
    }
  }
  
  return null;
}
