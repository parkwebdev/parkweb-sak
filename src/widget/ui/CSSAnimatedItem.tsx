/**
 * CSSAnimatedItem Component
 * 
 * Wrapper component for staggered CSS animations in lists.
 * Uses CSS custom properties for animation delay set by parent CSSAnimatedList.
 * 
 * @module widget/CSSAnimatedItem
 */

import React from 'react';
import { cn } from '@/lib/utils';

/** Props for the CSSAnimatedItem component */
interface CSSAnimatedItemProps {
  /** Child elements to animate */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Inline styles (receives --stagger-delay from parent) */
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
