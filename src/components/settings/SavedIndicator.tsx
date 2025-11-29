import { CheckCircle } from '@untitledui/icons';
import { cn } from '@/lib/utils';

interface SavedIndicatorProps {
  show: boolean;
  className?: string;
}

export const SavedIndicator = ({ show, className }: SavedIndicatorProps) => {
  if (!show) return null;
  
  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 animate-fade-in", className)}>
      <CheckCircle className="h-3 w-3" />
      <span>Saved</span>
    </div>
  );
};
