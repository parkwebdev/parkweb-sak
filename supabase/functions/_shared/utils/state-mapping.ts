/**
 * US State Mapping Utilities
 * Normalizes state names and abbreviations to consistent 2-letter codes.
 * 
 * @module _shared/utils/state-mapping
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
 * Valid 2-letter state abbreviations
 */
const VALID_ABBREVIATIONS = new Set(Object.keys(STATE_ABBREVIATIONS));

/**
 * Common typos, abbreviations, and variations mapped to 2-letter codes
 */
const TYPO_MAP: Record<string, string> = {
  // Arizona
  'ARIZ': 'AZ', 'ARIZ.': 'AZ', 'ARIZON': 'AZ',
  // California
  'CALIF': 'CA', 'CALIF.': 'CA', 'CALI': 'CA', 'CAL': 'CA', 'CAL.': 'CA',
  // Florida
  'FLA': 'FL', 'FLA.': 'FL', 'FLOR': 'FL',
  // Texas
  'TEX': 'TX', 'TEX.': 'TX',
  // Washington
  'WASH': 'WA', 'WASH.': 'WA',
  // Michigan
  'MICH': 'MI', 'MICH.': 'MI',
  // Pennsylvania
  'PENN': 'PA', 'PENN.': 'PA', 'PENNA': 'PA', 'PENNA.': 'PA',
  // Massachusetts
  'MASS': 'MA', 'MASS.': 'MA',
  // Virginia
  'VIRG': 'VA', 'VIRG.': 'VA',
  // New York
  'N.Y.': 'NY', 'N.Y': 'NY',
  // New Jersey
  'N.J.': 'NJ', 'N.J': 'NJ',
  // New Mexico
  'N.M.': 'NM', 'N.M': 'NM',
  // North Carolina
  'N.C.': 'NC', 'N.C': 'NC',
  // South Carolina
  'S.C.': 'SC', 'S.C': 'SC',
  // North Dakota
  'N.D.': 'ND', 'N.D': 'ND',
  // South Dakota
  'S.D.': 'SD', 'S.D': 'SD',
  // West Virginia
  'W.V.': 'WV', 'W.VA': 'WV', 'W.VA.': 'WV',
  // Colorado
  'COLO': 'CO', 'COLO.': 'CO',
  // Connecticut
  'CONN': 'CT', 'CONN.': 'CT',
  // Delaware
  'DEL': 'DE', 'DEL.': 'DE',
  // Illinois
  'ILL': 'IL', 'ILL.': 'IL',
  // Indiana
  'IND': 'IN', 'IND.': 'IN',
  // Kentucky
  'KENT': 'KY', 'KENT.': 'KY',
  // Louisiana
  'LOUIS': 'LA', 'LOUIS.': 'LA',
  // Minnesota
  'MINN': 'MN', 'MINN.': 'MN',
  // Mississippi
  'MISS': 'MS', 'MISS.': 'MS',
  // Nebraska
  'NEBR': 'NE', 'NEBR.': 'NE', 'NEB': 'NE', 'NEB.': 'NE',
  // Nevada
  'NEV': 'NV', 'NEV.': 'NV',
  // Oklahoma
  'OKLA': 'OK', 'OKLA.': 'OK',
  // Oregon
  'ORE': 'OR', 'ORE.': 'OR', 'OREG': 'OR', 'OREG.': 'OR',
  // Tennessee
  'TENN': 'TN', 'TENN.': 'TN',
  // Vermont
  'VERM': 'VT', 'VERM.': 'VT',
  // Wisconsin
  'WISC': 'WI', 'WISC.': 'WI', 'WIS': 'WI', 'WIS.': 'WI',
  // Wyoming
  'WYO': 'WY', 'WYO.': 'WY',
};

/**
 * Normalize state input (abbreviation or full name → full name).
 * 
 * @param stateInput - State abbreviation or full name
 * @returns Full state name, or original input if not found
 */
export function normalizeState(stateInput: string): string {
  const stateUpper = stateInput.toUpperCase().trim();
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

/**
 * Normalize a state input to a 2-letter abbreviation.
 * 
 * Handles:
 * - Full state names: "Arizona" → "AZ"
 * - Abbreviations: "AZ" → "AZ"
 * - Variations: "Ariz.", "CALIF" → "AZ", "CA"
 * 
 * @param input - State name, abbreviation, or variation
 * @returns 2-letter state abbreviation or null if invalid
 */
export function normalizeStateToAbbreviation(input: string | null): string | null {
  if (!input) return null;
  
  const trimmed = input.trim();
  if (!trimmed) return null;
  
  const upper = trimmed.toUpperCase();
  
  // Check if already a valid abbreviation
  if (VALID_ABBREVIATIONS.has(upper)) {
    return upper;
  }
  
  // Check full state names
  const fromName = STATE_NAMES_TO_ABBR[upper];
  if (fromName) return fromName;
  
  // Check typos and variations
  const fromTypo = TYPO_MAP[upper];
  if (fromTypo) return fromTypo;
  
  // Try removing periods and checking again
  const withoutPeriods = upper.replace(/\./g, '');
  if (VALID_ABBREVIATIONS.has(withoutPeriods)) {
    return withoutPeriods;
  }
  const fromTypoNoPeriods = TYPO_MAP[withoutPeriods];
  if (fromTypoNoPeriods) return fromTypoNoPeriods;
  
  return null;
}

/**
 * Check if a string is a valid US state abbreviation
 */
export function isValidStateAbbreviation(abbr: string): boolean {
  return VALID_ABBREVIATIONS.has(abbr.toUpperCase());
}

/**
 * Get full state name from abbreviation
 */
export function getStateNameFromAbbreviation(abbr: string): string | null {
  const upper = abbr.toUpperCase();
  return STATE_ABBREVIATIONS[upper] || null;
}
