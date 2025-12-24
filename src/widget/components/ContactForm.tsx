/**
 * ContactForm Component
 * 
 * Lead capture form displayed before chat begins. Collects first name, last name,
 * email, and custom fields. Includes honeypot spam protection and input validation.
 * 
 * @module widget/components/ContactForm
 */

import { Suspense, useState } from 'react';
import { WidgetButton, WidgetInput, WidgetCheckbox } from '../ui';
import { WidgetSelect, WidgetSelectTrigger, WidgetSelectValue, WidgetSelectContent, WidgetSelectItem } from '../ui';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInputField } from '../constants';
import { createLead } from '../api';
import { useSystemTheme } from '../hooks/useSystemTheme';
import type { ChatUser } from '../types';
import { logger } from '@/utils/logger';

/** Custom field configuration */
interface CustomField {
  /** Unique field identifier */
  id: string;
  /** Display label for the field */
  label: string;
  /** Field input type */
  fieldType: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
  /** Whether field is required */
  required: boolean;
  /** Options for select fields */
  options?: string[];
  /** HTML content displayed below checkbox (supports bold, italic, links) */
  richTextContent?: string;
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
}

/**
 * Lead capture contact form component.
 * 
 * @param props - Component props
 * @returns Form element with input fields and submit button
 */
export const ContactForm = ({
  agentId,
  primaryColor,
  title,
  subtitle,
  customFields,
  formLoadTime,
  onSubmit,
}: ContactFormProps) => {
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [checkboxValues, setCheckboxValues] = useState<Record<string, boolean>>({});
  const systemTheme = useSystemTheme();

  // Theme-aware colors: white in dark mode, primaryColor in light mode
  const buttonBgColor = systemTheme === 'dark' ? '#FFFFFF' : primaryColor;
  const buttonTextColor = systemTheme === 'dark' ? '#000000' : '#FFFFFF';
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const honeypot = formData.get('website') as string;
    const customFieldData: Record<string, any> = {};

    if (honeypot) {
      logger.debug('Spam detected: honeypot filled');
      return;
    }

    // Collect custom field values
    customFields.forEach(field => {
      if (field.fieldType === 'checkbox') {
        // Store checkbox value as boolean
        customFieldData[field.label] = checkboxValues[field.id] || false;
        // Also store the rich text content for display in lead details
        if (field.richTextContent) {
          customFieldData[`${field.label}_content`] = field.richTextContent;
        }
      } else {
        const value = formData.get(field.id);
        if (value) {
          customFieldData[field.label] = value;
        }
      }
    });

    try {
      const errors: Record<string, string> = {};
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedEmail = email.trim();
      
      if (!trimmedFirstName || trimmedFirstName.length > 50) {
        errors.firstName = 'First name is required (max 50 chars)';
      }
      if (!trimmedLastName || trimmedLastName.length > 50) {
        errors.lastName = 'Last name is required (max 50 chars)';
      }
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) || trimmedEmail.length > 255) {
        errors.email = 'Valid email is required';
      }
      
      // Validate required checkboxes
      customFields.forEach(field => {
        if (field.fieldType === 'checkbox' && field.required) {
          if (!checkboxValues[field.id]) {
            errors[field.id] = `${field.label} is required`;
          }
        }
      });
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setFormErrors({});

      const { leadId, conversationId } = await createLead(agentId, { 
        firstName: trimmedFirstName, 
        lastName: trimmedLastName, 
        email: trimmedEmail, 
        customFields: customFieldData, 
        _formLoadTime: formLoadTime 
      });
      
      const userData: ChatUser = { 
        firstName: trimmedFirstName, 
        lastName: trimmedLastName, 
        email: trimmedEmail, 
        leadId, 
        conversationId: conversationId || undefined 
      };
      
      onSubmit(userData, conversationId);
    } catch (error) {
      logger.error('Error creating lead:', error);
    }
  };

  return (
    <div className="flex items-start">
      <div className="bg-muted rounded-lg p-3 w-full">
        <p className="text-base font-semibold mb-0.5">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
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
          <WidgetInput name="firstName" placeholder="First name" className="text-sm" required autoComplete="given-name" />
          {formErrors.firstName && <p className="text-xs text-destructive" role="alert">{formErrors.firstName}</p>}
          <WidgetInput name="lastName" placeholder="Last name" className="text-sm" required autoComplete="family-name" />
          {formErrors.lastName && <p className="text-xs text-destructive" role="alert">{formErrors.lastName}</p>}
          <WidgetInput name="email" type="email" placeholder="Email" className="text-sm" required autoComplete="email" />
          {formErrors.email && <p className="text-xs text-destructive" role="alert">{formErrors.email}</p>}
          
          {customFields.map(field => (
            <div key={field.id}>
              {field.fieldType === 'checkbox' ? (
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
              ) : field.fieldType === 'select' ? (
                <WidgetSelect name={field.id} required={field.required}>
                  <WidgetSelectTrigger className="text-sm">
                    <WidgetSelectValue placeholder={field.label} />
                  </WidgetSelectTrigger>
                  <WidgetSelectContent>
                    {field.options?.map(opt => (
                      <WidgetSelectItem key={opt} value={opt}>{opt}</WidgetSelectItem>
                    ))}
                  </WidgetSelectContent>
                </WidgetSelect>
              ) : field.fieldType === 'textarea' ? (
                <Textarea name={field.id} placeholder={field.label} className="text-sm" required={field.required} />
              ) : field.fieldType === 'phone' ? (
                <Suspense fallback={<WidgetInput placeholder={field.label} className="text-sm" disabled />}>
                  <PhoneInputField 
                    name={field.id}
                    placeholder={field.label}
                    className="text-sm"
                    required={field.required}
                  />
                </Suspense>
              ) : (
                <WidgetInput name={field.id} type={field.fieldType === 'email' ? 'email' : 'text'} placeholder={field.label} className="text-sm" required={field.required} />
              )}
            </div>
          ))}
          
          <WidgetButton type="submit" size="default" className="w-full" style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}>
            Start Chat
          </WidgetButton>
        </form>
      </div>
    </div>
  );
};
