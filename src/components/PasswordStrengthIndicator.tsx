import React from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const calculatePasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 4) return { score, label: 'Medium', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
};

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  className 
}) => {
  const { score, label, color } = calculatePasswordStrength(password);
  const percentage = (score / 6) * 100;

  if (!password) return null;

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password strength:</span>
        <span className={cn("text-xs font-medium", {
          'text-destructive': label === 'Weak',
          'text-yellow-600 dark:text-yellow-500': label === 'Medium',
          'text-green-600 dark:text-green-500': label === 'Strong',
        })}>
          {label}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className={cn("h-1.5 rounded-full transition-all duration-300", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {password && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Password should contain:</p>
          <ul className="space-y-0.5 pl-3">
            <li className={password.length >= 8 ? 'text-green-600 dark:text-green-500' : ''}>
              • At least 8 characters
            </li>
            <li className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-500' : ''}>
              • One uppercase letter
            </li>
            <li className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-500' : ''}>
              • One lowercase letter
            </li>
            <li className={/[0-9]/.test(password) ? 'text-green-600 dark:text-green-500' : ''}>
              • One number
            </li>
            <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600 dark:text-green-500' : ''}>
              • One special character
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};