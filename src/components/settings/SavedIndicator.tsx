/**
 * @fileoverview Animated saved indicator with auto-hide functionality.
 * Displays a green checkmark with fade animation.
 */

import { CheckCircle } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface SavedIndicatorProps {
  show: boolean;
  message?: string;
  className?: string;
  duration?: number; // Auto-hide duration in ms (0 = no auto-hide)
}

export const SavedIndicator = ({ 
  show, 
  message = 'Saved', 
  className,
  duration = 2000 
}: SavedIndicatorProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
      
      if (duration > 0) {
        const hideTimer = setTimeout(() => {
          setIsExiting(true);
          const removeTimer = setTimeout(() => {
            setIsVisible(false);
          }, 300); // Match fade-out animation duration
          
          return () => clearTimeout(removeTimer);
        }, duration);
        
        return () => clearTimeout(hideTimer);
      }
    } else {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  if (!isVisible) return null;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500 transition-all duration-300",
        isExiting ? "animate-fade-out opacity-0" : "animate-fade-in opacity-100",
        className
      )}
    >
      <CheckCircle className="h-3 w-3" />
      <span>{message}</span>
    </div>
  );
};
