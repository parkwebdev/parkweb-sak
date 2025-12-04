import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'folder' | 'online' | 'complete' | 'incomplete' | 'in-review' | 'outline' | 'pending';
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
        return "items-center border shadow-sm flex gap-1 bg-background px-1.5 py-0.5 rounded-md border-border w-auto";
      case 'online':
        return "items-center border shadow-sm flex gap-1 text-xs text-foreground font-medium whitespace-nowrap text-center bg-background px-1.5 py-0.5 rounded-md border-border w-auto";
      case 'complete':
        return "items-center flex text-xs font-medium whitespace-nowrap text-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full w-auto";
      case 'incomplete':
        return "items-center flex text-xs font-medium whitespace-nowrap text-center bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded-full w-auto";
      case 'in-review':
        return "items-center flex text-xs font-medium whitespace-nowrap text-center bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full w-auto";
      case 'outline':
        return "items-center border flex text-xs text-foreground font-medium whitespace-nowrap text-center bg-transparent px-2 py-1 rounded-full border-border w-auto";
      case 'pending':
        return "items-center flex text-xs font-medium whitespace-nowrap text-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full w-auto";
      default:
        return "items-center border flex text-xs text-foreground font-medium whitespace-nowrap text-center bg-muted px-2 py-1 rounded-full border-border w-auto";
    }
  };

  return (
    <div className={`${getVariantClasses()} ${className}`}>
      {children}
    </div>
  );
};
