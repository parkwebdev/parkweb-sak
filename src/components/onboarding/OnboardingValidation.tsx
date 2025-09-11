import { OnboardingData } from './OnboardingTypes';

// Email validation function
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Form validation for each step
export const validateCurrentStep = (onboardingData: OnboardingData): boolean => {
  const { currentStep } = onboardingData;
  
  switch (currentStep) {
    case 1:
      return true; // Welcome step
    case 2:
      return !!(
        onboardingData.companyName?.trim() &&
        onboardingData.industry?.trim() &&
        onboardingData.companyDescription?.trim()
      );
    case 3:
      return !!(
        onboardingData.contactName?.trim() &&
        onboardingData.email?.trim() &&
        isValidEmail(onboardingData.email)
      );
    case 4:
      return !!(
        onboardingData.projectGoals?.trim() &&
        onboardingData.targetAudience?.trim()
      );
    case 5:
      return true; // Features are optional
    case 6:
      return true; // Additional info is optional
    case 7:
      return true; // Review step
    default:
      return false;
  }
};

export const getProgressPercentage = (data: OnboardingData) => {
  const totalFields = 17; // Total number of required/important fields
  let completedFields = 0;
  
  // Company Information (4 fields)
  if (data.companyName?.trim()) completedFields++;
  if (data.industry?.trim()) completedFields++;
  if (data.website?.trim()) completedFields++;
  if (data.companyDescription?.trim()) completedFields++;
  
  // Contact Information (4 fields)
  if (data.contactName?.trim()) completedFields++;
  if (data.title?.trim()) completedFields++;
  if (data.email?.trim() && isValidEmail(data.email)) completedFields++;
  if (data.phone?.trim()) completedFields++;
  
  // Project Information (4 fields)
  if (data.projectGoals?.trim()) completedFields++;
  if (data.targetAudience?.trim()) completedFields++;
  if (data.audienceTags?.length > 0) completedFields++;
  if (data.keyFeatures?.length > 0) completedFields++;
  
  // Additional Information (5 fields)
  if (data.currentWebsite?.trim()) completedFields++;
  if (data.competitorWebsites?.some(site => site.trim())) completedFields++;
  if (data.brandingAssets !== undefined) completedFields++;
  if (data.contentReady !== undefined) completedFields++;
  if (data.additionalNotes?.trim()) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
};