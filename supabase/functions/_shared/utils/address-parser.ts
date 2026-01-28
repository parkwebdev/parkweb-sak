/**
 * US Address Parsing Utilities
 * Extracts city, state, and ZIP from combined address strings.
 * 
 * @module _shared/utils/address-parser
 * @description Provides regex-based parsing for US addresses without requiring AI.
 * 
 * @example
 * ```typescript
 * import { parseAddressComponents, normalizeAndParseAddress } from "../_shared/utils/address-parser.ts";
 * 
 * const parsed = parseAddressComponents("123 Main St, Phoenix, AZ 85001");
 * // { street: "123 Main St", city: "Phoenix", state: "AZ", zip: "85001" }
 * 
 * const normalized = normalizeAndParseAddress("456 Oak Ave Los Angeles California 90210");
 * // { street: "456 Oak Ave", city: "Los Angeles", state: "CA", zip: "90210" }
 * ```
 */

import { normalizeStateToAbbreviation } from './state-mapping.ts';

/**
 * US State abbreviations and full names for matching.
 * Pattern matches both 2-letter abbreviations and full state names.
 */
const STATE_PATTERN = /\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|District of Columbia)\b/i;

/**
 * ZIP code pattern (5 digits with optional +4 extension)
 */
const ZIP_PATTERN = /\b(\d{5})(-\d{4})?\b/;

/**
 * Common multi-word city names that need special handling
 */
const MULTI_WORD_CITIES = new Set([
  'los angeles', 'new york', 'san francisco', 'san diego', 'las vegas',
  'salt lake city', 'kansas city', 'new orleans', 'oklahoma city',
  'santa monica', 'san jose', 'el paso', 'fort worth', 'palm springs',
  'palm beach', 'west palm beach', 'st louis', 'st. louis', 'saint louis',
  'st paul', 'st. paul', 'saint paul', 'san antonio', 'santa fe',
  'santa barbara', 'santa cruz', 'santa ana', 'costa mesa', 'newport beach',
  'long beach', 'virginia beach', 'daytona beach', 'miami beach',
  'panama city', 'cedar rapids', 'grand rapids', 'colorado springs',
  'sioux falls', 'sioux city', 'north las vegas', 'north hollywood',
  'south bend', 'ann arbor', 'bowling green', 'cedar city', 'corpus christi',
  'el cajon', 'fort collins', 'fort lauderdale', 'fort myers', 'fort wayne',
  'green bay', 'high point', 'jersey city', 'lake charles', 'lake havasu city',
  'little rock', 'new haven', 'new bedford', 'north charleston', 'palo alto',
  'port charlotte', 'port st lucie', 'rancho cucamonga', 'redwood city',
  'rio rancho', 'rock hill', 'san bernardino', 'san marcos', 'san mateo',
  'san rafael', 'santa clarita', 'santa rosa', 'west covina', 'west jordan',
  'white plains', 'wilkes barre', 'winston salem',
]);

export interface ParsedAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

/**
 * Normalize and clean address string before parsing.
 * 
 * @param rawAddress - The raw address string
 * @returns Normalized address string
 */
function normalizeAddressString(rawAddress: string): string {
  return rawAddress
    .trim()
    .replace(/\s+/g, ' ')                    // Collapse whitespace
    .replace(/,{2,}/g, ',')                  // Collapse multiple commas
    .replace(/\bApt\.?\s*/gi, 'Apt ')        // Normalize apartment
    .replace(/\bSte\.?\s*/gi, 'Suite ')      // Normalize suite
    .replace(/\bN\.?\s+/g, 'North ')         // Expand directionals
    .replace(/\bS\.?\s+/g, 'South ')
    .replace(/\bE\.?\s+/g, 'East ')
    .replace(/\bW\.?\s+/g, 'West ')
    .replace(/\bSt\.\s/g, 'Street ')         // Expand street abbreviations
    .replace(/\bAve\.\s/g, 'Avenue ')
    .replace(/\bBlvd\.\s/g, 'Boulevard ')
    .replace(/\bDr\.\s/g, 'Drive ')
    .replace(/\bLn\.\s/g, 'Lane ')
    .replace(/\bRd\.\s/g, 'Road ');
}

/**
 * Detect if words form a known multi-word city.
 * 
 * @param words - Array of words to check
 * @returns Object with city name and number of words consumed, or null
 */
function detectMultiWordCity(words: string[]): { city: string; consumed: number } | null {
  // Check 3-word, then 2-word combinations from the end
  for (let len = 3; len >= 2; len--) {
    if (words.length >= len) {
      const candidate = words.slice(-len).join(' ').toLowerCase();
      if (MULTI_WORD_CITIES.has(candidate)) {
        return { city: words.slice(-len).join(' '), consumed: len };
      }
    }
  }
  return null;
}

/**
 * Parse a combined US address string into components.
 * 
 * Handles common formats like:
 * - "123 Main St, Phoenix, AZ 85001"
 * - "456 Oak Ave, Los Angeles, California 90210"
 * - "789 First St, Suite 100, Denver, CO 80202-1234"
 * - "100 Park Lane Denver CO 80204" (no commas)
 * 
 * @param fullAddress - The complete address string to parse
 * @returns Parsed address components (street, city, state, zip)
 */
export function parseAddressComponents(fullAddress: string | null): ParsedAddress {
  if (!fullAddress || typeof fullAddress !== 'string') {
    return { street: null, city: null, state: null, zip: null };
  }
  
  const trimmed = fullAddress.trim();
  if (!trimmed) {
    return { street: null, city: null, state: null, zip: null };
  }

  // Extract ZIP code
  const zipMatch = trimmed.match(ZIP_PATTERN);
  const zip = zipMatch ? zipMatch[1] : null;
  
  // Extract state and normalize to abbreviation
  const stateMatch = trimmed.match(STATE_PATTERN);
  const rawState = stateMatch ? stateMatch[1] : null;
  const state = rawState ? normalizeStateToAbbreviation(rawState) : null;
  
  // Parse city - typically the part before state, after the last comma before state
  let city: string | null = null;
  let street: string | null = trimmed;
  
  if (state) {
    // Try comma-separated parsing first
    const parts = trimmed.split(',').map(p => p.trim());
    
    for (let i = 0; i < parts.length; i++) {
      // Check if this part contains the state
      if (STATE_PATTERN.test(parts[i])) {
        // City is the previous part (if exists)
        if (i > 0) {
          city = parts[i - 1];
          // Street is everything before the city part
          if (i > 1) {
            street = parts.slice(0, i - 1).join(', ').trim();
          } else {
            // Only 2 parts (street+city, city+state) - try to extract city from same part as state
            const beforeState = parts[i].replace(STATE_PATTERN, '').replace(ZIP_PATTERN, '').trim();
            if (beforeState && beforeState !== parts[i - 1]) {
              // The city might be in the same segment as state
              city = parts[i - 1];
              street = null; // Can't determine street in this case
            }
          }
        } else {
          // State is in first part - try to extract city from same part
          // e.g., "Phoenix, AZ 85001" or "Phoenix AZ 85001"
          const beforeState = parts[i].split(STATE_PATTERN)[0].trim();
          if (beforeState) {
            city = beforeState.replace(/,\s*$/, '').trim();
            street = null;
          }
        }
        break;
      }
    }
    
    // If no city found via comma parsing, try space-based parsing
    // e.g., "123 Main St Phoenix AZ 85001"
    if (!city) {
      // Remove ZIP from the string for cleaner parsing
      let withoutZip = trimmed;
      if (zip) {
        withoutZip = trimmed.replace(ZIP_PATTERN, '').trim();
      }
      
      // Find where state appears
      const stateIdx = withoutZip.search(STATE_PATTERN);
      if (stateIdx > 0) {
        const beforeState = withoutZip.substring(0, stateIdx).trim();
        // Last word before state is likely the city
        const words = beforeState.split(/\s+/);
        if (words.length >= 2) {
          // Check for multi-word cities first
          const multiWord = detectMultiWordCity(words);
          if (multiWord) {
            city = multiWord.city;
            street = words.slice(0, -multiWord.consumed).join(' ').trim() || null;
          } else {
            // Single word city
            city = words[words.length - 1];
            street = words.slice(0, -1).join(' ').trim() || null;
          }
        } else if (words.length === 1) {
          city = words[0];
          street = null;
        }
      }
    }
  }
  
  // Clean up street - remove trailing commas
  if (street) {
    street = street.replace(/,\s*$/, '').trim();
    if (!street) street = null;
  }
  
  // Clean up city - remove trailing commas and ZIP if accidentally included
  if (city) {
    city = city.replace(/,\s*$/, '').replace(ZIP_PATTERN, '').trim();
    if (!city) city = null;
  }

  return { street, city, state, zip };
}

/**
 * Smart address normalization and parsing.
 * Normalizes the address string before parsing for better results.
 * 
 * @param rawAddress - The raw address string
 * @returns Parsed address components with normalized state
 */
export function normalizeAndParseAddress(rawAddress: string | null): ParsedAddress {
  if (!rawAddress) {
    return { street: null, city: null, state: null, zip: null };
  }
  
  const normalized = normalizeAddressString(rawAddress);
  return parseAddressComponents(normalized);
}

/**
 * Extract only the ZIP code from an address string.
 * 
 * @param address - Address string that may contain a ZIP code
 * @returns 5-digit ZIP code or null
 */
export function extractZipFromAddress(address: string | null): string | null {
  if (!address) return null;
  const match = address.match(ZIP_PATTERN);
  return match ? match[1] : null;
}
