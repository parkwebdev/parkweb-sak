/**
 * ContactForm Component
 * 
 * Lead capture form displayed before chat begins. Collects first name, last name,
 * email, and custom fields. Supports multi-step form flow with per-step validation.
 * Includes honeypot spam protection and input validation.
 * 
 * @module widget/components/ContactForm
 */

import { Suspense, useState, useMemo } from 'react';
import { WidgetButton, WidgetInput, WidgetCheckbox, WidgetTextarea } from '../ui';
import { WidgetSelect, WidgetSelectTrigger, WidgetSelectValue, WidgetSelectContent, WidgetSelectItem } from '../ui';
import { PhoneInputField } from '../constants';
import { createLead } from '../api';
import { useSystemTheme } from '../hooks/useSystemTheme';
import { TurnstileWidget } from './TurnstileWidget';
import type { ChatUser } from '../types';
import { logger } from '@/utils/logger';
import { ChevronLeft, ChevronRight } from '../icons';

// Turnstile site key from environment (public key, safe to expose)
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

/** Custom field configuration */
interface CustomField {
  /** Unique field identifier */
  id: string;
  /** Display label for the field */
  label: string;
  /** Field input type */
  fieldType: 'text' | 'name' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
  /** Whether field is required */
  required: boolean;
  /** Options for select fields */
  options?: string[];
  /** HTML content displayed below checkbox (supports bold, italic, links) */
  richTextContent?: string;
  /** Which step this field belongs to (1-based, undefined = step 1) */
  step?: number;
}

/** Form step configuration */
interface FormStep {
  id: string;
  title?: string;
  subtitle?: string;
}

/** Props for the ContactForm component */
interface ContactFormProps {
  /** Agent ID for lead creation */
  agentId: string;
  /** Primary brand color for submit button */
  primaryColor: string;
  /** Form title text */
  title: string;
  /** Optional form subtitle text */
  subtitle?: string;
  /** Array of custom field configurations */
  customFields: CustomField[];
  /** Timestamp when form was loaded (for spam protection) */
  formLoadTime: number;
  /** Form submission handler */
  onSubmit: (userData: ChatUser, conversationId?: string) => void;
  /** Enable multi-step form mode */
  enableMultiStepForm?: boolean;
  /** Step configurations for multi-step forms */
  formSteps?: FormStep[];
}

/**
 * Lead capture contact form component with optional multi-step support.
 * 
 * NOTE: Hardcoded hex colors (#FFFFFF, #000000) are intentional.
 * The widget renders in an isolated iframe without access to the parent
 * document's CSS variables. Using hex ensures consistent button styling
 * regardless of the host page's theme configuration.
 */
export const ContactForm = ({
  agentId,
  primaryColor,
  title,
  subtitle,
  customFields,
  formLoadTime,
  onSubmit,
  enableMultiStepForm = false,
  formSteps = [{ id: 'step-1' }],
}: ContactFormProps) => {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const systemTheme = useSystemTheme();

  // Theme-aware colors (hex intentional for iframe isolation - see component JSDoc)
  const buttonBgColor = systemTheme === 'dark' ? '#FFFFFF' : primaryColor;
  const buttonTextColor = systemTheme === 'dark' ? '#000000' : '#FFFFFF';
  
  // Calculate total steps and current step config (multi-step is always enabled)
  const totalSteps = formSteps.length;
  const currentStepConfig = formSteps[currentStep - 1];
  
  // Get fields for current step
  const currentStepFields = useMemo(() => {
    return customFields.filter(field => (field.step || 1) === currentStep);
  }, [customFields, currentStep]);
  
  // Get display title/subtitle - use step config if available, otherwise form defaults
  const displayTitle = currentStepConfig?.title || title;
  const displaySubtitle = currentStepConfig?.subtitle || (currentStep === 1 ? subtitle : undefined);

  /**
   * Validate fields for the current step only
   */
  const validateCurrentStep = (formData: FormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    // Step 1: Validate required default fields (firstName, lastName)
    if (currentStep === 1) {
      const firstName = formData.get('firstName') as string;
      const lastName = formData.get('lastName') as string;
      
      if (!firstName?.trim() || firstName.length > 50) {
        errors.firstName = 'First name is required';
      }
      if (!lastName?.trim() || lastName.length > 50) {
        errors.lastName = 'Last name is required';
      }
    }
    
    // Validate required custom fields for current step
    currentStepFields.forEach(field => {
      if (field.fieldType === 'checkbox' && field.required) {
        if (!checkboxValues[field.id]) {
          errors[field.id] = `${field.label} is required`;
        }
      } else if (field.required && field.fieldType !== 'checkbox') {
        const value = formData.get(field.id) as string;
        if (!value || !value.trim()) {
          errors[field.id] = `${field.label} is required`;
        }
        
        // Additional validation for email type
        if (field.fieldType === 'email' && value && value.trim()) {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 255) {
            errors[field.id] = 'Please enter a valid email address';
          }
        }
      }
    });
    
    return errors;
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Get form data from the form element
    const form = (e.target as HTMLElement).closest('form');
    if (!form) return;
    
    const formData = new FormData(form);
    const errors = validateCurrentStep(formData);
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const honeypot = formData.get('website') as string;
    const customFieldData: Record<string, { value: unknown; type: string }> = {};

    if (honeypot) {
      logger.debug('Spam detected: honeypot filled');
      return;
    }

    // Validate current step before final submission
    const stepErrors = validateCurrentStep(formData);
    if (Object.keys(stepErrors).length > 0) {
      setFormErrors(stepErrors);
      return;
    }

    // Collect ALL custom field values (from all steps) with type metadata
    customFields.forEach(field => {
      if (field.fieldType === 'checkbox') {
        customFieldData[field.label] = {
          value: checkboxValues[field.id] || false,
          type: 'checkbox'
        };
        if (field.richTextContent) {
          customFieldData[`${field.label}_content`] = {
            value: field.richTextContent,
            type: 'text'
          };
        }
      } else {
        const value = formData.get(field.id);
        if (value) {
          customFieldData[field.label] = {
            value: value,
            type: field.fieldType
          };
        }
      }
    });

    // Get default field values
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    try {
      setFormErrors({});

      const { leadId, conversationId } = await createLead(agentId, { 
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        customFields: customFieldData, 
        _formLoadTime: formLoadTime,
        turnstileToken: turnstileToken,
      });
      
      // Extract email from custom fields for ChatUser (smart detection)
      let extractedEmail = '';
      customFields.forEach(field => {
        const value = formData.get(field.id) as string;
        if (field.fieldType === 'email' && value) {
          extractedEmail = value.trim();
        }
      });
      
      const userData: ChatUser = { 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        email: extractedEmail, 
        leadId, 
        conversationId: conversationId ?? undefined 
      };
      
      onSubmit(userData, conversationId ?? undefined);
    } catch (error: unknown) {
      logger.error('Error creating lead:', error);
    }
  };

  const renderField = (field: CustomField) => {
    switch (field.fieldType) {
      case 'checkbox':
        return (
          <>
            <WidgetCheckbox
              name={field.id}
              label={field.label}
              richTextContent={field.richTextContent}
              required={field.required}
              checked={checkboxValues[field.id] || false}
              onChange={(checked) => setCheckboxValues(prev => ({ ...prev, [field.id]: checked }))}
              error={!!formErrors[field.id]}
            />
            {formErrors[field.id] && (
              <p className="text-xs text-destructive mt-1 pl-7" role="alert">{formErrors[field.id]}</p>
            )}
          </>
        );
      case 'select':
        return (
          <WidgetSelect name={field.id} required={field.required}>
            <WidgetSelectTrigger>
              <WidgetSelectValue placeholder={field.label} />
            </WidgetSelectTrigger>
            <WidgetSelectContent>
              {field.options?.map(opt => (
                <WidgetSelectItem key={opt} value={opt}>{opt}</WidgetSelectItem>
              ))}
            </WidgetSelectContent>
          </WidgetSelect>
        );
      case 'textarea':
        return <WidgetTextarea name={field.id} placeholder={field.label} required={field.required} />;
      case 'phone':
        return (
          <Suspense fallback={<WidgetInput placeholder={field.label} disabled />}>
            <PhoneInputField 
              name={field.id}
              placeholder={field.label}
              required={field.required}
            />
          </Suspense>
        );
      case 'name':
        return (
          <WidgetInput 
            name={field.id} 
            type="text" 
            placeholder={field.label} 
            required={field.required}
            autoComplete="name"
          />
        );
      default: // text, email
        return (
          <WidgetInput 
            name={field.id} 
            type={field.fieldType === 'email' ? 'email' : 'text'} 
            placeholder={field.label} 
            required={field.required}
            autoComplete={field.fieldType === 'email' ? 'email' : undefined}
          />
        );
    }
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex items-start">
      <div className="bg-muted rounded-lg p-3 w-full">
        {/* Step indicator */}
        {totalSteps > 1 && (
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  index + 1 === currentStep 
                    ? 'w-4 bg-foreground' 
                    : index + 1 < currentStep
                    ? 'w-1.5 bg-foreground/60'
                    : 'w-1.5 bg-foreground/20'
                }`}
              />
            ))}
          </div>
        )}
        
        <p className="text-base font-semibold mb-0.5">{displayTitle}</p>
        {displaySubtitle && (
          <p className="text-sm text-muted-foreground mb-4">{displaySubtitle}</p>
        )}
        
        <form className="space-y-2" onSubmit={handleSubmit}>
          {/* Honeypot field - hidden from users, bots fill it */}
          <input 
            name="website" 
            type="text" 
            tabIndex={-1} 
            autoComplete="off"
            className="absolute -left-[9999px] h-0 w-0 opacity-0 pointer-events-none"
            aria-hidden="true"
          />
          
          {/* Default fields on step 1: First Name and Last Name */}
          {currentStep === 1 && (
            <>
              <div>
                <WidgetInput 
                  name="firstName" 
                  type="text" 
                  placeholder="First name" 
                  required
                  autoComplete="given-name"
                />
                {formErrors.firstName && (
                  <p className="text-xs text-destructive mt-1" role="alert">{formErrors.firstName}</p>
                )}
              </div>
              <div>
                <WidgetInput 
                  name="lastName" 
                  type="text" 
                  placeholder="Last name" 
                  required
                  autoComplete="family-name"
                />
                {formErrors.lastName && (
                  <p className="text-xs text-destructive mt-1" role="alert">{formErrors.lastName}</p>
                )}
              </div>
            </>
          )}
          
          {/* Custom fields for current step */}
          {currentStepFields.map(field => (
            <div key={field.id}>
              {renderField(field)}
              {formErrors[field.id] && field.fieldType !== 'checkbox' && (
                <p className="text-xs text-destructive mt-1" role="alert">{formErrors[field.id]}</p>
              )}
            </div>
          ))}
          
          {/* Cloudflare Turnstile bot protection (invisible unless suspicious) - only on last step */}
          {TURNSTILE_SITE_KEY && isLastStep && (
            <TurnstileWidget
              siteKey={TURNSTILE_SITE_KEY}
              onVerify={(token) => setTurnstileToken(token)}
              onError={() => logger.warn('Turnstile verification failed')}
              onExpire={() => setTurnstileToken(null)}
            />
          )}
          
          {/* Navigation buttons */}
          {totalSteps > 1 ? (
            <div className="flex items-center gap-2 pt-1">
              {currentStep > 1 && (
                <WidgetButton 
                  type="button" 
                  variant="outline" 
                  size="default"
                  onClick={handleBack}
                  className="flex-shrink-0"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Back
                </WidgetButton>
              )}
              
              {isLastStep ? (
                <WidgetButton 
                  type="submit" 
                  size="default" 
                  className="flex-1" 
                  style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                >
                  Start Chat
                </WidgetButton>
              ) : (
                <WidgetButton 
                  type="button" 
                  size="default" 
                  className="flex-1" 
                  onClick={handleNext}
                  style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
                >
                  Next
                  <ChevronRight size={16} aria-hidden="true" />
                </WidgetButton>
              )}
            </div>
          ) : (
            <WidgetButton 
              type="submit" 
              size="default" 
              className="w-full" 
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              Start Chat
            </WidgetButton>
          )}
        </form>
      </div>
    </div>
  );
};
