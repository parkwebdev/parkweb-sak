/**
 * Validation Utilities
 * 
 * Common validation functions for user data.
 * 
 * @module utils/validation
 */

/**
 * Validates an email address format.
 * 
 * @param email - The email address to validate
 * @returns True if the email format is valid
 * 
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
