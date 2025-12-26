/**
 * Centralized field key constants for leads and custom data.
 * Eliminates duplication across LeadDetailsSheet, leads-columns, LeadsKanbanBoard.
 * 
 * @module lib/field-keys
 */

/**
 * Common phone field names to check in lead.data JSONB for legacy leads.
 * Used when the dedicated phone column is empty.
 */
export const PHONE_FIELD_KEYS = [
  'phone',
  'Phone',
  'phone_number',
  'phoneNumber',
  'Phone Number',
  'Phone number',
  'telephone',
  'mobile',
  'Mobile',
  'cell',
  'Cell',
  'tel',
] as const;

/**
 * Fields to exclude when rendering custom fields in lead details.
 * These are either internal tracking fields or already displayed separately.
 */
export const EXCLUDED_LEAD_FIELDS = [
  // Internal tracking
  'source',
  'referrer',
  'page_url',
  'visitor_id',
  // Name fields (displayed separately)
  'first_name',
  'firstName',
  'First Name',
  'last_name',
  'lastName',
  'Last Name',
  'name',
  'full_name',
  'fullName',
  // Email fields (displayed separately)
  'email',
  'Email',
  // Phone fields (displayed separately)
  ...PHONE_FIELD_KEYS,
] as const;

/**
 * Patterns that identify consent-related checkbox fields.
 * These fields get special tooltip treatment showing the consent text.
 */
export const CONSENT_FIELD_PATTERNS = [
  'consent',
  'agree',
  'accept',
  'terms',
  'privacy',
  'gdpr',
  'opt-in',
  'optin',
] as const;

/**
 * Check if a field key represents a phone field.
 */
export const isPhoneFieldKey = (key: string): boolean => {
  const lowerKey = key.toLowerCase();
  return lowerKey.includes('phone') || 
         lowerKey.includes('mobile') || 
         lowerKey.includes('cell') || 
         lowerKey.includes('tel');
};

/**
 * Check if a field key represents a consent field.
 */
export const isConsentFieldKey = (key: string): boolean => {
  const lowerKey = key.toLowerCase();
  return CONSENT_FIELD_PATTERNS.some(pattern => lowerKey.includes(pattern));
};

/**
 * Get the phone value from lead data, checking the dedicated column first,
 * then falling back to common phone field names in the data JSONB.
 */
export const getPhoneFromLeadData = (
  phone: string | null | undefined,
  data: Record<string, unknown> | null | undefined
): string => {
  // Primary: Use dedicated phone column
  if (phone) return phone;
  
  // Fallback for legacy leads: Search data JSONB
  if (!data) return '';
  
  for (const key of PHONE_FIELD_KEYS) {
    if (key in data && data[key]) {
      return String(data[key]);
    }
  }
  return '';
};

/**
 * Filter lead data to only include custom fields (excluding internal/known fields).
 */
export const getCustomFieldsFromLeadData = (
  data: Record<string, unknown> | null | undefined
): [string, unknown][] => {
  if (!data) return [];
  
  return Object.entries(data).filter(([key]) => {
    // Exclude known internal fields
    if (EXCLUDED_LEAD_FIELDS.includes(key as typeof EXCLUDED_LEAD_FIELDS[number])) return false;
    // Exclude _content fields (internal rich text storage for checkboxes)
    if (key.endsWith('_content')) return false;
    return true;
  });
};
