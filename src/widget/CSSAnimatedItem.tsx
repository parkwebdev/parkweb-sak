import React from 'react';
import { cn } from '@/lib/utils';

interface CSSAnimatedItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const CSSAnimatedItem = ({ 
  children, 
  className,
  style
}: CSSAnimatedItemProps) => {
  return (
    <div 
      className={cn('widget-animated-item', className)}
      style={style}
    >
      {children}
    </div>
  );
};
