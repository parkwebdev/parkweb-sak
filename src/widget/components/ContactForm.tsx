/**
 * ContactForm Component
 * 
 * Lead capture form displayed before chat begins. Collects first name, last name,
 * email, and custom fields. Includes honeypot spam protection and input validation.
 * 
 * @module widget/components/ContactForm
 */

import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInputField } from '../constants';
import { createLead } from '../api';
import type { ChatUser } from '../types';

/** Custom field configuration */
interface CustomField {
  /** Unique field identifier */
  id: string;
  /** Display label for the field */
  label: string;
  /** Field input type */
  fieldType: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  /** Whether field is required */
  required: boolean;
  /** Options for select fields */
  options?: string[];
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const honeypot = formData.get('website') as string;
    const customFieldData: Record<string, any> = {};

    if (honeypot) {
      console.log('Spam detected: honeypot filled');
      return;
    }

    customFields.forEach(field => {
      const value = formData.get(field.id);
      if (value) {
        customFieldData[field.label] = value;
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
      console.error('Error creating lead:', error);
    }
  };

  return (
    <div className="flex items-start">
      <div className="bg-muted rounded-lg p-3 w-full">
        <p className="text-base font-semibold mb-1.5">{title}</p>
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
          <Input name="firstName" placeholder="First name" className="text-sm" required />
          {formErrors.firstName && <p className="text-xs text-destructive">{formErrors.firstName}</p>}
          <Input name="lastName" placeholder="Last name" className="text-sm" required />
          {formErrors.lastName && <p className="text-xs text-destructive">{formErrors.lastName}</p>}
          <Input name="email" type="email" placeholder="Email" className="text-sm" required />
          {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
          
          {customFields.map(field => (
            <div key={field.id}>
              {field.fieldType === 'select' ? (
                <Select name={field.id} required={field.required}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder={field.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.fieldType === 'textarea' ? (
                <Textarea name={field.id} placeholder={field.label} className="text-sm" required={field.required} />
              ) : field.fieldType === 'phone' ? (
                <Suspense fallback={<Input placeholder={field.label} className="text-sm" disabled />}>
                  <PhoneInputField 
                    name={field.id}
                    placeholder={field.label}
                    className="text-sm"
                    required={field.required}
                  />
                </Suspense>
              ) : (
                <Input name={field.id} type={field.fieldType === 'email' ? 'email' : 'text'} placeholder={field.label} className="text-sm" required={field.required} />
              )}
            </div>
          ))}
          
          <Button type="submit" size="lg" className="w-full text-white" style={{ backgroundColor: primaryColor }}>
            Start Chat
          </Button>
        </form>
      </div>
    </div>
  );
};
