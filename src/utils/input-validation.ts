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

// Text field validation with sanitization
export const validateAndSanitizeText = (
  text: string, 
  options: { 
    maxLength?: number; 
    minLength?: number; 
    allowHtml?: boolean;
    fieldName?: string;
  } = {}
): { isValid: boolean; sanitized: string; error?: string } => {
  const { maxLength = 1000, minLength = 0, allowHtml = false, fieldName = 'Text' } = options;
  
  const trimmed = text.trim();
  
  // Length validation
  if (trimmed.length < minLength) {
    return { isValid: false, sanitized: '', error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (trimmed.length > maxLength) {
    return { isValid: false, sanitized: '', error: `${fieldName} must be less than ${maxLength} characters` };
  }
  
  // Sanitize based on HTML allowance
  const sanitized = allowHtml 
    ? DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'] })
    : DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [] });
  
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

// JSON validation and sanitization
export const validateAndSanitizeJSON = (jsonString: string, maxSize = 10000): { isValid: boolean; sanitized: any; error?: string } => {
  if (jsonString.length > maxSize) {
    return { isValid: false, sanitized: null, error: 'JSON data too large' };
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    
    // Deep sanitize all string values in the object
    const sanitized = sanitizeObjectStrings(parsed);
    
    return { isValid: true, sanitized };
  } catch (error) {
    return { isValid: false, sanitized: null, error: 'Invalid JSON format' };
  }
};

// Helper function to recursively sanitize strings in objects
const sanitizeObjectStrings = (obj: any): any => {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectStrings);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = DOMPurify.sanitize(key, { ALLOWED_TAGS: [] });
      sanitized[sanitizedKey] = sanitizeObjectStrings(value);
    }
    return sanitized;
  }
  
  return obj;
};