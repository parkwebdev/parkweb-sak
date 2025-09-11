import { FileUploadResult } from '@/lib/file-upload';

export interface OnboardingData {
  // Company Information
  companyName: string;
  industry: string;
  website: string;
  companyDescription: string;
  
  // Contact Information
  contactName: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  
  // Project Information
  projectGoals: string;
  targetAudience: string;
  audienceTags: string[];
  keyFeatures: string[];
  
  // Additional Information
  currentWebsite: string;
  competitorWebsites: string[];
  brandingAssets: boolean;
  brandingFiles: FileUploadResult[];
  contentReady: boolean;
  contentFiles: FileUploadResult[];
  additionalNotes: string;
  
  currentStep: number;
}