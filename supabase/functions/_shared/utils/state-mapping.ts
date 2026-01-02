/**
 * US State Mapping Utilities
 * Normalizes state names and abbreviations for bidirectional search.
 * 
 * @module _shared/utils/state-mapping
 * @description Provides state abbreviation to full name mapping for property searches.
 * 
 * @example
 * ```typescript
 * import { normalizeState, STATE_ABBREVIATIONS } from "../_shared/utils/state-mapping.ts";
 * 
 * const fullName = normalizeState("CA"); // "California"
 * const fullName2 = normalizeState("California"); // "California"
 * ```
 */

/**
 * US State abbreviation to full name mapping.
 * Includes all 50 states plus DC.
 */
export const STATE_ABBREVIATIONS: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
};

/**
 * Reverse mapping: full name to abbreviation.
 */
export const STATE_NAMES_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_ABBREVIATIONS).map(([abbr, name]) => [name.toUpperCase(), abbr])
);

/**
 * Normalize state input (abbreviation or full name → full name).
 * 
 * @param stateInput - State abbreviation or full name
 * @returns Full state name, or original input if not found
 */
export function normalizeState(stateInput: string): string {
  const stateUpper = stateInput.toUpperCase().trim();
  // If it's an abbreviation, convert to full name; otherwise use as-is
  return STATE_ABBREVIATIONS[stateUpper] || stateInput;
}

/**
 * Get state abbreviation from full name.
 * 
 * @param stateName - Full state name
 * @returns Two-letter abbreviation, or original input if not found
 */
export function getStateAbbreviation(stateName: string): string {
  const nameUpper = stateName.toUpperCase().trim();
  return STATE_NAMES_TO_ABBR[nameUpper] || stateName;
}
