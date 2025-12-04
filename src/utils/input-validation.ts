import DOMPurify from 'isomorphic-dompurify';

// Email validation with sanitization
export const validateAndSanitizeEmail = (email: string): { isValid: boolean; sanitized: string; error?: string } => {
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

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[]; score: number } => {
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
