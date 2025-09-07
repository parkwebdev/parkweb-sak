// Form state validation and debugging utilities

export interface FormValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateFormState = (data: any): FormValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required structure
  if (!data || typeof data !== 'object') {
    errors.push('Form data is not a valid object');
    return { isValid: false, errors, warnings };
  }

  // Validate step number
  if (!data.currentStep || data.currentStep < 1 || data.currentStep > 7) {
    errors.push(`Invalid step number: ${data.currentStep}`);
  }

  // Check for unexpected pre-population
  const allowedPrePopFields = ['companyName', 'contactName'];
  const prePopulatedFields = Object.entries(data)
    .filter(([key, value]) => {
      return value && 
             typeof value === 'string' && 
             value.trim() !== '' && 
             !allowedPrePopFields.includes(key) &&
             key !== 'currentStep';
    })
    .map(([key]) => key);

  if (prePopulatedFields.length > 0) {
    warnings.push(`Unexpected pre-populated fields: ${prePopulatedFields.join(', ')}`);
  }

  // Check for data corruption signs
  if (data.companyName && typeof data.companyName !== 'string') {
    errors.push('Company name is not a string');
  }

  if (data.contactName && typeof data.contactName !== 'string') {
    errors.push('Contact name is not a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const sanitizeFormData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Ensure step is valid
  const sanitizedData = { ...data };
  if (!sanitizedData.currentStep || sanitizedData.currentStep < 1 || sanitizedData.currentStep > 7) {
    sanitizedData.currentStep = 1;
  }

  // Ensure arrays are properly initialized
  if (!Array.isArray(sanitizedData.audienceTags)) {
    sanitizedData.audienceTags = [];
  }
  
  if (!Array.isArray(sanitizedData.keyFeatures)) {
    sanitizedData.keyFeatures = [];
  }

  if (!Array.isArray(sanitizedData.competitorWebsites)) {
    sanitizedData.competitorWebsites = [''];
  }

  return sanitizedData;
};

export const logFormStateChange = (
  action: string, 
  previousData: any, 
  newData: any, 
  context?: string
): void => {
  // Form state logging disabled in production
};