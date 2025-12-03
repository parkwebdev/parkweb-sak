import { useState, useEffect, forwardRef, ChangeEvent } from 'react';
import { AsYouType, parsePhoneNumber, CountryCode, getCountryCallingCode } from 'libphonenumber-js/min';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Emoji flags using regional indicator symbols
const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

interface PhoneInputFieldProps {
  value?: string;
  onChange?: (phone: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  name?: string;
  defaultCountry?: CountryCode;
}

export const PhoneInputField = forwardRef<HTMLInputElement, PhoneInputFieldProps>(({ 
  value = '', 
  onChange, 
  placeholder = "Phone number",
  className,
  required,
  name,
  defaultCountry = 'US'
}, ref) => {
  const [inputValue, setInputValue] = useState('');
  const [detectedCountry, setDetectedCountry] = useState<CountryCode | null>(defaultCountry);

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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // Use AsYouType formatter for live formatting
    const formatter = new AsYouType(detectedCountry || defaultCountry);
    const formatted = formatter.getNumber() ? formatter.input(rawValue) : rawValue;
    
    // Try to detect country from input
    const asYouType = new AsYouType();
    asYouType.input(rawValue.startsWith('+') ? rawValue : `+${getCountryCallingCode(detectedCountry || defaultCountry)}${rawValue.replace(/\D/g, '')}`);
    const country = asYouType.getCountry();
    
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
  };

  return (
    <div className="relative flex items-center">
      {detectedCountry && (
        <div className="absolute left-3 flex items-center pointer-events-none z-10 text-base">
          {getCountryFlag(detectedCountry)}
        </div>
      )}
      <Input
        ref={ref}
        name={name}
        type="tel"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(detectedCountry ? 'pl-10' : '', className)}
        required={required}
      />
    </div>
  );
});

PhoneInputField.displayName = 'PhoneInputField';
