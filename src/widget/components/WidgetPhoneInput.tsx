/**
 * WidgetPhoneInput Component
 * 
 * International phone number input with auto-formatting and country detection.
 * Displays country flag based on detected phone number format.
 * Uses libphonenumber-js/min for parsing and formatting.
 * 
 * WIDGET-NATIVE: Uses WidgetInput instead of @/components/ui/input to avoid motion/react dependency.
 * 
 * @module widget/components/WidgetPhoneInput
 */

import { useState, useEffect, forwardRef, useCallback, type ChangeEvent } from 'react';
import { AsYouType, parsePhoneNumber, type CountryCode } from 'libphonenumber-js/min';
import { WidgetInput } from '../ui/WidgetInput';
import { cn } from '@/lib/utils';

interface WidgetPhoneInputProps {
  /** Current phone value (E.164 format preferred) */
  value?: string;
  /** Callback when phone changes - passes E.164 format when valid */
  onChange?: (phone: string) => void;
  /** Input placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether field is required */
  required?: boolean;
  /** Form field name */
  name?: string;
  /** Default country for formatting (defaults to US) */
  defaultCountry?: CountryCode;
}

/**
 * Widget-native phone input with international formatting and country flag.
 * 
 * Features:
 * - Auto-formats phone numbers as user types
 * - Detects country from phone number format
 * - Displays country flag on left side
 * - Outputs E.164 format when valid
 * 
 * @example
 * ```tsx
 * <WidgetPhoneInput
 *   name="phone"
 *   placeholder="Phone number"
 *   onChange={(phone) => setPhone(phone)}
 * />
 * ```
 */
export const WidgetPhoneInput = forwardRef<HTMLInputElement, WidgetPhoneInputProps>(({ 
  value = '', 
  onChange, 
  placeholder = "Phone number",
  className,
  required,
  name,
  defaultCountry = 'US'
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<CountryCode | null>(null);

  // Format initial value if provided
  useEffect(() => {
    if (value) {
      try {
        const phoneNumber = parsePhoneNumber(value);
        if (phoneNumber) {
          setDetectedCountry(phoneNumber.country || defaultCountry);
          setInputValue(phoneNumber.formatNational());
        } else {
          setInputValue(value);
        }
      } catch {
        setInputValue(value);
      }
    }
  }, []);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Use AsYouType formatter for live formatting with proper country-specific formatting
    const formatter = new AsYouType(detectedCountry || defaultCountry);
    const formatted = formatter.input(rawValue);
    
    // Detect country from the formatted result
    const country = formatter.getCountry();
    if (country) {
      setDetectedCountry(country);
    }

    setInputValue(formatted);
    
    // Pass the E.164 format to parent (or raw if invalid)
    try {
      const phoneNumber = parsePhoneNumber(rawValue, detectedCountry || defaultCountry);
      if (phoneNumber?.isValid()) {
        onChange?.(phoneNumber.format('E.164'));
      } else {
        onChange?.(rawValue);
      }
    } catch {
      onChange?.(rawValue);
    }
  }, [detectedCountry, defaultCountry, onChange]);

  return (
    <div className="relative flex items-center">
      {detectedCountry && (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-4 flex items-center justify-center overflow-hidden pointer-events-none z-10">
          <img 
            src={`https://flagcdn.com/${detectedCountry.toLowerCase()}.svg`}
            alt={detectedCountry}
            width={14}
            className="h-3 w-auto object-contain"
          />
        </div>
      )}
      <WidgetInput
        ref={ref}
        name={name}
        type="tel"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(detectedCountry ? 'pl-9' : '', className)}
        required={required}
      />
    </div>
  );
});

WidgetPhoneInput.displayName = 'WidgetPhoneInput';
