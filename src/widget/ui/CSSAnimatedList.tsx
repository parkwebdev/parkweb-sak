/**
 * CSSAnimatedList Component
 * 
 * Container for staggered CSS animations. Sets --stagger-delay CSS custom
 * property on each child based on index for cascading entrance animations.
 * 
 * @module widget/CSSAnimatedList
 */

import React from 'react';
import { cn } from '@/lib/utils';

/** Props for the CSSAnimatedList component */
interface CSSAnimatedListProps {
  /** Child CSSAnimatedItem elements */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Delay between each item's animation start (seconds) */
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
        if (React.isValidElement<{ style?: React.CSSProperties }>(child)) {
          return React.cloneElement(child, {
            style: {
              ...(child.props.style || {}),
              '--stagger-delay': `${index * staggerDelay}s`
            } as React.CSSProperties
          });
        }
        return child;
      })}
    </div>
  );
};
