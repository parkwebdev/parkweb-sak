/**
 * Email Tag Input Component
 * 
 * A multi-email input that displays emails as removable badges/tags.
 * Supports keyboard navigation (Enter/Tab to add) and validation.
 * 
 * @module components/ui/email-tag-input
 */
import * as React from 'react';
import { useState, useRef, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, XClose } from '@untitledui/icons';
import { isValidEmail } from '@/utils/validation';
import { cn } from '@/lib/utils';

interface EmailTagInputProps {
  /** Array of email strings */
  value: string[];
  /** Callback when emails change */
  onChange: (emails: string[]) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Maximum number of emails allowed */
  maxEmails?: number;
  /** Additional className for the container */
  className?: string;
}

/**
 * Multi-email input with tag/badge display.
 * 
 * @example
 * ```tsx
 * const [emails, setEmails] = useState<string[]>([]);
 * <EmailTagInput
 *   value={emails}
 *   onChange={setEmails}
 *   placeholder="Enter email address"
 * />
 * ```
 */
const EmailTagInput = React.forwardRef<HTMLDivElement, EmailTagInputProps>(
  ({ value, onChange, placeholder = 'Enter email address', disabled = false, maxEmails, className }, ref) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const addEmail = (email: string) => {
      const trimmed = email.trim().toLowerCase();
      
      if (!trimmed) return;
      
      if (!isValidEmail(trimmed)) {
        setError('Invalid email format');
        return;
      }
      
      if (value.includes(trimmed)) {
        setError('Email already added');
        return;
      }
      
      if (maxEmails && value.length >= maxEmails) {
        setError(`Maximum ${maxEmails} emails allowed`);
        return;
      }
      
      onChange([...value, trimmed]);
      setInputValue('');
      setError(null);
    };

    const removeEmail = (emailToRemove: string) => {
      onChange(value.filter(email => email !== emailToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (inputValue.trim()) {
          e.preventDefault();
          addEmail(inputValue);
        }
      } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
        // Remove last email when backspace is pressed on empty input
        removeEmail(value[value.length - 1]);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setError(null);
      
      // Check for comma or space to auto-add email
      if (newValue.includes(',') || newValue.includes(' ')) {
        const emails = newValue.split(/[,\s]+/).filter(Boolean);
        emails.forEach(email => addEmail(email));
        setInputValue('');
      } else {
        setInputValue(newValue);
      }
    };

    const handleContainerClick = () => {
      inputRef.current?.focus();
    };

    const handleAddClick = () => {
      addEmail(inputValue);
      inputRef.current?.focus();
    };

    const isAddDisabled = disabled || !inputValue.trim() || !isValidEmail(inputValue.trim());

    return (
      <div ref={ref} className={cn('space-y-1.5', className)}>
        <div
          onClick={handleContainerClick}
          className={cn(
            'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            disabled && 'cursor-not-allowed opacity-50',
            error && 'border-destructive focus-within:ring-destructive'
          )}
        >
          {value.map((email) => (
            <Badge
              key={email}
              variant="secondary"
              size="sm"
              className="gap-1 pr-1"
            >
              {email}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(email);
                }}
                disabled={disabled}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label={`Remove ${email}`}
              >
                <XClose size={12} />
              </button>
            </Badge>
          ))}
          <div className="flex flex-1 items-center gap-1">
            <input
              ref={inputRef}
              type="email"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="min-w-[120px] flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              aria-label="Add email address"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddClick}
              disabled={isAddDisabled}
              className="h-6 w-6 p-0 shrink-0"
              aria-label="Add email"
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

EmailTagInput.displayName = 'EmailTagInput';

export { EmailTagInput };
