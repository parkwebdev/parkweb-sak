/**
 * Input Validation Utilities
 * 
 * Provides sanitization and validation for user inputs including
 * email addresses and password strength checks.
 * 
 * @module utils/input-validation
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Result type for email validation.
 */
interface EmailValidationResult {
  /** Whether the email is valid */
  isValid: boolean;
  /** Sanitized email string (empty if invalid) */
  sanitized: string;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Result type for password strength validation.
 */
interface PasswordValidationResult {
  /** Whether the password meets all requirements */
  isValid: boolean;
  /** Array of failed requirement messages */
  errors: string[];
  /** Strength score from 0-5 */
  score: number;
}

/**
 * Validates and sanitizes an email address.
 * Checks length, format, and sanitizes using DOMPurify.
 * 
 * @param email - The email address to validate
 * @returns Validation result with sanitized email or error
 * 
 * @example
 * const result = validateAndSanitizeEmail('user@example.com');
 * if (result.isValid) {
 *   console.log(result.sanitized); // 'user@example.com'
 * }
 */
export const validateAndSanitizeEmail = (email: string): EmailValidationResult => {
  const trimmed = email.trim();
  
  // Length check
  if (trimmed.length > 254) {
    return { isValid: false, sanitized: '', error: 'Email too long' };
  }
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, sanitized: '', error: 'Invalid email format' };
  }
  
  // Sanitize
  const sanitized = DOMPurify.sanitize(trimmed);
  
  return { isValid: true, sanitized };
};

/**
 * Validates password strength against security requirements.
 * Checks length, character diversity, and common patterns.
 * 
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - No common patterns (123456, password, etc.)
 * 
 * @param password - The password to validate
 * @returns Validation result with errors and strength score (0-5)
 * 
 * @example
 * const result = validatePasswordStrength('MySecure@Pass123');
 * if (result.isValid) {
 *   console.log('Password is strong!');
 * } else {
 *   console.log('Issues:', result.errors);
 * }
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  } else {
    score += 1;
  }
  
  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }
  
  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }
  
  // Number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }
  
  // Special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 1;
  }
  
  // Common patterns check
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Password contains common patterns');
  } else {
    score += 1;
  }
  
  return { 
    isValid: errors.length === 0, 
    errors, 
    score: Math.min(score, 5) 
  };
};
