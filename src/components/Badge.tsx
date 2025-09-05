import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'folder' | 'online';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = ""
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'folder':
        return "items-center border shadow-sm flex gap-1 bg-background px-1.5 py-0.5 rounded-md border-border";
      case 'online':
        return "items-center border shadow-sm flex gap-1 text-xs text-foreground font-medium whitespace-nowrap text-center bg-background px-1.5 py-0.5 rounded-md border-border";
      default:
        return "items-center border flex text-xs text-foreground font-medium whitespace-nowrap text-center bg-muted px-2 py-0.5 rounded-full border-border";
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {children}
    </div>
  );
};
