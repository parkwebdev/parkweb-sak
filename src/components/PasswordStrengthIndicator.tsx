import React from 'react';
import { cn } from '@/lib/utils';
import { validatePasswordStrength } from '@/utils/input-validation';
import { CheckCircle, XCircle, AlertCircle } from '@untitledui/icons';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  className 
}) => {
  const validation = validatePasswordStrength(password);
  
  if (!password) return null;

  const getStrengthColor = (score: number) => {
    if (score >= 5) return 'text-success';
    if (score >= 3) return 'text-warning';
    return 'text-destructive';
  };

  const getStrengthText = (score: number) => {
    if (score >= 5) return 'Strong';
    if (score >= 3) return 'Medium';
    return 'Weak';
  };

  const getIcon = (score: number) => {
    if (score >= 5) return <CheckCircle size={16} className="text-success" />;
    if (score >= 3) return <AlertCircle size={16} className="text-warning" />;
    return <XCircle size={16} className="text-destructive" />;
  };

  const percentage = (validation.score / 6) * 100;

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getIcon(validation.score)}
          <span className="text-xs text-muted-foreground">Password strength:</span>
        </div>
        <span className={cn("text-xs font-medium", getStrengthColor(validation.score))}>
          {getStrengthText(validation.score)}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className={cn("h-1.5 rounded-full transition-all duration-300", {
            'bg-destructive': validation.score < 3,
            'bg-warning': validation.score >= 3 && validation.score < 5,
            'bg-success': validation.score >= 5,
          })}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Requirements:</p>
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <XCircle size={12} className="text-destructive" />
              {error}
            </div>
          ))}
        </div>
      )}
      
      {validation.isValid && (
        <div className="flex items-center gap-2 text-xs text-success">
          Password meets all security requirements
        </div>
      )}
    </div>
  );
};