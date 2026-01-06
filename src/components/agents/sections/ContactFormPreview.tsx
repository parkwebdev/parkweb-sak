/**
 * ContactFormPreview
 * 
 * A visual-only preview of the contact form as it appears in the widget.
 * All inputs are disabled - this is purely for visualization.
 */

import { cn } from '@/lib/utils';
import DOMPurify from 'isomorphic-dompurify';
import type { CustomField } from '@/hooks/useEmbeddedChatConfig';

interface ContactFormPreviewProps {
  title: string;
  subtitle: string;
  customFields: CustomField[];
  primaryColor: string;
  enabled: boolean;
}

export function ContactFormPreview({
  title,
  subtitle,
  customFields,
  primaryColor,
  enabled,
}: ContactFormPreviewProps) {
  const inputClasses = cn(
    'w-full h-9 px-3 text-sm rounded-md border border-input bg-background',
    'text-muted-foreground placeholder:text-muted-foreground/60',
    'disabled:cursor-not-allowed disabled:opacity-60'
  );

  const renderFieldPreview = (field: CustomField) => {
    const placeholder = field.placeholder || field.label;

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
      {/* Title */}
      {title && (
        <p className="text-base font-semibold mb-0.5">{title}</p>
      )}
      
      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      )}

      <div className="space-y-3">
        {/* Default fields */}
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
        <input
          type="email"
          disabled
          placeholder="Email"
          className={inputClasses}
        />

        {/* Custom fields */}
        {customFields.map(renderFieldPreview)}

        {/* Submit button */}
        <button
          disabled
          className="w-full h-10 rounded-md text-sm font-medium text-white disabled:cursor-not-allowed"
          style={{ backgroundColor: primaryColor || 'hsl(var(--primary))' }}
        >
          Start Chat
        </button>
      </div>
    </div>
  );
}
