import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  children: ReactNode;
  className?: string;
}

export const SectionHeader = ({ children, className }: SectionHeaderProps) => {
  return (
    <h4 className={cn(
      "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3",
      className
    )}>
      {children}
    </h4>
  );
};
