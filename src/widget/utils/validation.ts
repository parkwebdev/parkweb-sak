/**
 * Validation Utilities
 * 
 * Functions for validating user input, IDs, and form data.
 */

/**
 * UUID regex pattern for database IDs
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID (database conversation/message ID)
 * @param id - The string to validate
 * @returns True if the string is a valid UUID
 */
export function isValidUUID(id: string | null | undefined): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Validate email address format
 * @param email - The email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate that a required field has content
 * @param value - The value to check
 * @returns True if the value is non-empty after trimming
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validate phone number (basic check)
 * @param phone - The phone number to validate
 * @returns True if the phone number appears valid
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  // Valid phone numbers typically have 7-15 digits
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}
