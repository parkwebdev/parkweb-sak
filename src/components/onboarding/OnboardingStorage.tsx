import { OnboardingData } from './OnboardingTypes';
import { validateFormState, sanitizeFormData } from '@/utils/form-state-validator';
import { logger } from '@/utils/logger';

export class OnboardingStorage {
  private static readonly DRAFT_KEY = 'onboardingDraft';

  static initializeFormData(isFreshStart: boolean, clientName: string, companyName: string): OnboardingData {
    logger.debug('Initializing form data - Fresh start:', isFreshStart);
    
    const baseData: OnboardingData = {
      companyName: '',
      industry: '',
      website: '',
      companyDescription: '',
      contactName: '',
      title: '',
      email: '',
      phone: '',
      address: '',
      projectGoals: '',
      targetAudience: '',
      audienceTags: [],
      keyFeatures: [],
      currentWebsite: '',
      competitorWebsites: [''],
      brandingAssets: false,
      brandingFiles: [],
      contentReady: false,
      contentFiles: [],
      additionalNotes: '',
      currentStep: 1
    };

    // Only pre-populate these specific fields from URL params
    if (isFreshStart) {
      logger.debug('Pre-populating from URL params:', { clientName, companyName });
      baseData.companyName = companyName;
      baseData.contactName = clientName;
    }

    return baseData;
  }

  static saveDraft(data: OnboardingData, isFreshStart: boolean): void {
    // Don't auto-save for fresh starts during initial render
    if (isFreshStart && data.currentStep === 1) {
      logger.debug('Skipping auto-save for fresh start at step 1');
      return;
    }

    if (data.currentStep > 1) {
      logger.debug('Auto-saving draft at step:', data.currentStep);
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(data));
    }
  }

  static loadDraft(isFreshStart: boolean): OnboardingData | null {
    // Don't load draft if this is a fresh start with URL parameters
    if (isFreshStart) {
      logger.debug('Clearing existing draft for fresh start');
      localStorage.removeItem(this.DRAFT_KEY);
      return null;
    }
    
    const savedDraft = localStorage.getItem(this.DRAFT_KEY);
    if (savedDraft) {
      try {
        logger.debug('Loading saved draft from localStorage');
        const parsedDraft = JSON.parse(savedDraft);
        
        // Validate draft data structure
        if (parsedDraft && typeof parsedDraft === 'object' && parsedDraft.currentStep) {
          // Sanitize and validate the draft data
          const sanitizedDraft = sanitizeFormData(parsedDraft);
          const validation = validateFormState(sanitizedDraft);
          
          if (validation.isValid) {
            logger.success('Draft loaded successfully, resuming at step:', sanitizedDraft.currentStep);
            if (validation.warnings.length > 0) {
              logger.warn('Draft warnings:', validation.warnings);
            }
            return sanitizedDraft;
          } else {
            logger.error('Draft validation failed:', validation.errors);
            localStorage.removeItem(this.DRAFT_KEY);
          }
        } else {
          logger.warn('Invalid draft data structure, ignoring');
          localStorage.removeItem(this.DRAFT_KEY);
        }
      } catch (error) {
        logger.error('Error loading saved draft:', error);
        localStorage.removeItem(this.DRAFT_KEY);
      }
    } else {
      logger.info('No saved draft found, starting fresh');
    }

    return null;
  }

  static clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
  }
}