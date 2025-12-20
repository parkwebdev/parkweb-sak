/**
 * WidgetCheckbox Component
 * 
 * Lightweight checkbox for the widget. Uses native checkbox input.
 * Renders rich text content below the checkbox label.
 * WCAG 2.2 compliant with 44x44px touch targets and proper focus rings.
 * 
 * @module widget/ui/WidgetCheckbox
 */

import { cn } from '@/lib/utils';
import DOMPurify from 'isomorphic-dompurify';

interface WidgetCheckboxProps {
  /** Field name for form submission */
  name: string;
  /** Inline label displayed next to checkbox */
  label: string;
  /** HTML content displayed below checkbox (supports bold, italic, links) */
  richTextContent?: string;
  /** Whether the checkbox is required */
  required?: boolean;
  /** Controlled checked state */
  checked?: boolean;
  /** Change handler for controlled usage */
  onChange?: (checked: boolean) => void;
  /** Whether to show error styling */
  error?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Lightweight checkbox component for widget forms.
 * Renders an inline label with optional rich text content below.
 * Links in rich text open in new tabs for security.
 */
export const WidgetCheckbox = ({
  name,
  label,
  richTextContent,
  required = false,
  checked,
  onChange,
  error,
  className,
}: WidgetCheckboxProps) => {
  // Sanitize HTML content - only allow safe tags for consent text
  const sanitizedContent = richTextContent 
    ? DOMPurify.sanitize(richTextContent, { 
        ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'a', 'p', 'br', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
      }) 
    : '';

  // Handle link clicks to open in new tab
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Checkbox + Inline Label - 44px min touch target */}
      <label className="flex items-start gap-3 cursor-pointer min-h-[44px] py-2">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 rounded border border-input bg-background',
            'accent-primary cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
            error && 'border-destructive'
          )}
        />
        <span className={cn('text-sm font-medium leading-tight', error && 'text-destructive')}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </span>
      </label>
      
      {/* Rich Text Content Below */}
      {sanitizedContent && (
        <div 
          className="text-xs text-muted-foreground pl-7 leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer [&_p]:mb-1 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          onClick={handleContentClick}
        />
      )}
    </div>
  );
};
