/**
 * ACF Field Extraction Utilities
 * 
 * Handles extraction of values from ACF repeater fields and other complex structures.
 * Uses score-based field selection to intelligently identify value fields.
 * 
 * @module _shared/utils/acf-extraction
 */

// Fields that are clearly metadata, not values
const METADATA_FIELD_NAMES = new Set([
  'id', 'row_id', 'index', 'order', 'sort_order', 
  'acf_fc_layout', 'layout', 'type',
  'created_at', 'updated_at', 'modified',
  '_id', '__typename'
]);

// Field names that strongly indicate "this is the value"
const VALUE_FIELD_NAMES = new Set([
  'name', 'value', 'text', 'label', 'title', 
  'item', 'option', 'entry', 'content'
]);

// Suffixes that suggest a value field
const VALUE_SUFFIXES = [
  '_name', '_value', '_text', '_label', '_title',
  '_item', '_option', '_entry'
];

// Domain-specific hints for this application
const DOMAIN_HINTS = [
  'amenity', 'feature', 'policy', 'pet', 'rule',
  'utility', 'highlight', 'benefit', 'service',
  'description', 'desc', 'detail', 'info', 'note'
];

interface FieldScore {
  key: string;
  value: unknown;
  score: number;
}

/**
 * Score a field to determine likelihood it's "the value" in a repeater row.
 * Higher scores indicate more likely to be the display value.
 */
function scoreField(key: string, value: unknown): number {
  const lowerKey = key.toLowerCase();
  let score = 0;
  
  // Strongly penalize metadata fields
  if (METADATA_FIELD_NAMES.has(lowerKey)) {
    return -50;
  }
  
  // Score based on value type
  if (typeof value === 'string') {
    score += 10;
    // Short strings are more likely display values
    if (value.length < 100) score += 5;
    // Very short might be abbreviations
    if (value.length < 3) score -= 3;
    // Empty strings are not values
    if (!value.trim()) return -100;
  } else if (typeof value === 'number') {
    score += 5;
  } else if (typeof value === 'object' && value !== null) {
    // Objects/arrays are rarely the display value
    score -= 20;
  } else if (value == null) {
    return -100;
  }
  
  // Score based on field name - exact match on value words
  if (VALUE_FIELD_NAMES.has(lowerKey)) {
    score += 20;
  }
  
  // Check for value suffixes
  for (const suffix of VALUE_SUFFIXES) {
    if (lowerKey.endsWith(suffix)) {
      score += 15;
      break;
    }
  }
  
  // Check for domain-specific hints
  for (const hint of DOMAIN_HINTS) {
    if (lowerKey.includes(hint)) {
      score += 10;
      break;
    }
  }
  
  // Shorter field names are often the main field
  if (key.length < 10) score += 3;
  if (key.length < 6) score += 2;
  
  return score;
}

/**
 * Select the best value field from a repeater row object using scoring.
 */
function selectBestValue(obj: Record<string, unknown>): string | null {
  const entries = Object.entries(obj);
  
  // Single field - use it (no ambiguity)
  if (entries.length === 1) {
    const [, value] = entries[0];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return null;
  }
  
  // Score all fields
  const scored: FieldScore[] = entries.map(([key, value]) => ({
    key,
    value,
    score: scoreField(key, value)
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Return highest scoring string/number value
  for (const { value, score } of scored) {
    if (score < 0) continue; // Skip negatively scored fields
    
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  
  return null;
}

/**
 * Flatten an ACF repeater array to simple strings.
 * Uses score-based field selection for objects to intelligently pick the value field.
 * 
 * Handles:
 * - Simple string arrays: ["Pool", "Gym"]
 * - Object arrays: [{amenity: "Pool"}, {the_feature_name: "Gym"}]
 * - Mixed content with metadata fields: [{id: 1, value: "Pool"}]
 */
export function flattenRepeaterArray(arr: unknown[]): string[] {
  return arr
    .map(item => {
      // Simple string - return as-is
      if (typeof item === 'string') return item;
      
      // Number - convert to string
      if (typeof item === 'number') return String(item);
      
      // Object - use smart field selection
      if (typeof item === 'object' && item !== null) {
        return selectBestValue(item as Record<string, unknown>);
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
