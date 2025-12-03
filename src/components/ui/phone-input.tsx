import { usePhoneInput, FlagImage } from 'react-international-phone';
import 'react-international-phone/style.css';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface PhoneInputFieldProps {
  value?: string;
  onChange?: (phone: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  name?: string;
}

export const PhoneInputField = forwardRef<HTMLInputElement, PhoneInputFieldProps>(({ 
  value, 
  onChange, 
  placeholder = "Phone number",
  className,
  required,
  name 
}, ref) => {
  const { inputValue, country, handlePhoneValueChange, inputRef } = usePhoneInput({
    defaultCountry: 'us',
    value: value || '',
    onChange: ({ phone }) => onChange?.(phone),
  });

  // country is the ISO2 code string (e.g., 'us', 'gb', 'de')
  const countryCode = typeof country === 'string' ? country : country?.iso2;

  return (
    <div className="relative flex items-center">
      {countryCode && (
        <div className="absolute left-3 flex items-center pointer-events-none z-10">
          <FlagImage iso2={countryCode as any} size={16} />
        </div>
      )}
      <Input
        ref={inputRef}
        name={name}
        type="tel"
        value={inputValue}
        onChange={handlePhoneValueChange}
        placeholder={placeholder}
        className={cn(countryCode ? 'pl-10' : '', className)}
        required={required}
      />
    </div>
  );
});

PhoneInputField.displayName = 'PhoneInputField';
