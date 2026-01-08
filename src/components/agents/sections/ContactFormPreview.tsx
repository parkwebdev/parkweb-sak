/**
 * ContactFormPreview
 * 
 * A visual-only preview of the contact form as it appears in the widget.
 * All inputs are disabled - this is purely for visualization.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import DOMPurify from 'isomorphic-dompurify';
import type { CustomField, FormStep } from '@/hooks/useEmbeddedChatConfig';

/** Placeholder text for each field type */
const FIELD_PLACEHOLDERS: Record<string, string> = {
  name: 'Full name',
  email: 'Email',
  phone: 'Phone number',
  text: 'Enter text...',
  textarea: 'Enter text...',
  select: 'Select an option',
  checkbox: '',
};

interface ContactFormPreviewProps {
  title: string;
  subtitle: string;
  customFields: CustomField[];
  primaryColor: string;
  enabled: boolean;
  formSteps?: FormStep[];
}

export function ContactFormPreview({
  title,
  subtitle,
  customFields,
  primaryColor,
  enabled,
  formSteps = [{ id: 'step-1' }],
}: ContactFormPreviewProps) {
  const [previewStep, setPreviewStep] = useState(1);
  const { resolvedTheme } = useTheme();
  const totalSteps = formSteps.length;
  const currentStepConfig = formSteps[previewStep - 1];
  
  // Theme-aware button colors (matches widget behavior)
  // Check both resolvedTheme and document class for dark mode
  const isDark = resolvedTheme === 'dark' || (typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));
  const buttonBgColor = isDark ? '#FFFFFF' : (primaryColor || 'hsl(var(--primary))');
  const buttonTextColor = isDark ? '#000000' : '#FFFFFF';
  
  // Filter fields for current preview step (multi-step is always enabled)
  const currentStepFields = customFields.filter(f => (f.step || 1) === previewStep);
  
  const displayTitle = currentStepConfig?.title || title;
  const displaySubtitle = currentStepConfig?.subtitle || (previewStep === 1 ? subtitle : undefined);
  const inputClasses = cn(
    'w-full h-9 px-3 text-sm rounded-md border border-input bg-background',
    'text-muted-foreground placeholder:text-muted-foreground/60',
    'disabled:cursor-not-allowed disabled:opacity-60'
  );

  const renderFieldPreview = (field: CustomField) => {
    const placeholder = field.placeholder || field.label || FIELD_PLACEHOLDERS[field.fieldType] || '';

    switch (field.fieldType) {
      case 'textarea':
        return (
          <textarea
            key={field.id}
            disabled
            placeholder={placeholder}
            rows={3}
            className={cn(inputClasses, 'h-auto py-2 resize-none')}
          />
        );

      case 'select':
        return (
          <div
            key={field.id}
            className={cn(inputClasses, 'flex items-center justify-between')}
          >
            <span className="text-muted-foreground/60">{placeholder}</span>
            <svg
              className="h-4 w-4 text-muted-foreground/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        );

      case 'checkbox':
        const sanitizedHtml = field.richTextContent
          ? DOMPurify.sanitize(field.richTextContent, {
              ALLOWED_TAGS: ['a', 'strong', 'em', 'u', 'br'],
              ALLOWED_ATTR: ['href', 'target', 'rel'],
            })
          : '';

        return (
          <div key={field.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              disabled
              className="mt-0.5 h-4 w-4 rounded border-input disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="text-sm text-muted-foreground">
              <span>{field.label}</span>
              {field.required && <span className="text-destructive ml-0.5">*</span>}
              {sanitizedHtml && (
                <div
                  className="text-xs text-muted-foreground/80 mt-1 [&_a]:text-primary [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />
              )}
            </div>
          </div>
        );

      case 'phone':
        return (
          <input
            key={field.id}
            type="tel"
            disabled
            placeholder={placeholder}
            className={inputClasses}
          />
        );

      default: // text, email
        return (
          <input
            key={field.id}
            type="text"
            disabled
            placeholder={placeholder}
            className={inputClasses}
          />
        );
    }
  };

  if (!enabled) {
    return (
      <div className="bg-muted rounded-lg p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground">Contact form is disabled</p>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg p-4">
      {/* Step indicator */}
      {totalSteps > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-3">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPreviewStep(index + 1)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-200",
                index + 1 === previewStep 
                  ? 'w-4 bg-foreground' 
                  : index + 1 < previewStep
                  ? 'w-1.5 bg-foreground/60'
                  : 'w-1.5 bg-foreground/20'
              )}
            />
          ))}
        </div>
      )}
      
      {/* Title */}
      {displayTitle && (
        <p className="text-base font-semibold mb-0.5">{displayTitle}</p>
      )}
      
      {/* Subtitle */}
      {displaySubtitle && (
        <p className="text-sm text-muted-foreground mb-4">{displaySubtitle}</p>
      )}

      <div className="space-y-3">
        {/* Default fields on step 1: First name and Last name */}
        {previewStep === 1 && (
          <>
            <input
              type="text"
              disabled
              placeholder="First name"
              className={inputClasses}
            />
            <input
              type="text"
              disabled
              placeholder="Last name"
              className={inputClasses}
            />
          </>
        )}
        
        {/* Custom fields for current step */}
        {currentStepFields.map(renderFieldPreview)}

        {/* Navigation buttons */}
        {totalSteps > 1 ? (
          <div className="flex items-center gap-2 pt-1">
            {previewStep > 1 && (
              <button
                type="button"
                onClick={() => setPreviewStep(prev => Math.max(prev - 1, 1))}
                className="h-10 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-muted transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={() => previewStep < totalSteps && setPreviewStep(prev => prev + 1)}
              className="flex-1 h-10 rounded-md text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
            >
              {previewStep < totalSteps ? 'Next →' : 'Start Chat'}
            </button>
          </div>
        ) : (
          <button
            disabled
            className="w-full h-10 rounded-md text-sm font-medium disabled:cursor-not-allowed"
            style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
          >
            Start Chat
          </button>
        )}
      </div>
    </div>
  );
}
