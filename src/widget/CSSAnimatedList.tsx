import React from 'react';
import { cn } from '@/lib/utils';

interface CSSAnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const CSSAnimatedList = ({ 
  children, 
  className,
  staggerDelay = 0.05
}: CSSAnimatedListProps) => {
  return (
    <div className={cn('widget-animated-list', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            style: {
              ...((child.props as any).style || {}),
              '--stagger-delay': `${index * staggerDelay}s`
            } as React.CSSProperties
          });
        }
        return child;
      })}
    </div>
  );
};
