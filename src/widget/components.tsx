import React, { useState, useRef, useEffect } from 'react';

/**
 * Lightweight Widget Components
 * Using only CSS classes from widget-styles.ts
 * No Radix UI, no Tailwind compilation needed
 */

// ============= Card Components =============

export const WidgetCard = ({ 
  className = '', 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div 
      className={`bg-card text-card-foreground rounded-lg border border-border shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const WidgetCardHeader = ({ 
  className = '', 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`flex flex-col space-y-2 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const WidgetCardTitle = ({ 
  className = '', 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3 className={`text-2xl font-semibold ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const WidgetCardDescription = ({ 
  className = '', 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p className={`text-sm text-muted-foreground ${className}`} {...props}>
      {children}
    </p>
  );
};

export const WidgetCardContent = ({ 
  className = '', 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const WidgetCardFooter = ({ 
  className = '', 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

// ============= Button Components =============

interface WidgetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'icon';
}

export const WidgetButton = ({ 
  variant = 'primary', 
  size = 'default',
  className = '', 
  children, 
  disabled,
  ...props 
}: WidgetButtonProps) => {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  const sizeClasses = {
    default: '',
    sm: 'btn-sm',
    icon: 'btn-icon',
  };

  return (
    <button 
      className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-md ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// ============= Input Components =============

export const WidgetInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 ${className}`}
      {...props}
    />
  );
});
WidgetInput.displayName = 'WidgetInput';

export const WidgetTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 ${className}`}
      {...props}
    />
  );
});
WidgetTextarea.displayName = 'WidgetTextarea';

export const WidgetLabel = ({ 
  className = '', 
  children, 
  ...props 
}: React.LabelHTMLAttributes<HTMLLabelElement>) => {
  return (
    <label 
      className={`text-sm font-medium ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};

// ============= Select Component (Native) =============

interface WidgetSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export const WidgetSelect = React.forwardRef<HTMLSelectElement, WidgetSelectProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
WidgetSelect.displayName = 'WidgetSelect';

// ============= Avatar Components =============

export const WidgetAvatar = ({ 
  className = '', 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div 
      className={`avatar ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const WidgetAvatarImage = ({ 
  src, 
  alt, 
  className = '',
  ...props 
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return null;
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`w-full h-full object-cover ${className}`}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};

export const WidgetAvatarFallback = ({ 
  className = '', 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div 
      className={`flex items-center justify-center w-full h-full bg-muted text-sm font-medium ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ============= Badge Component =============

interface WidgetBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive';
}

export const WidgetBadge = ({ 
  variant = 'default',
  className = '', 
  children, 
  ...props 
}: WidgetBadgeProps) => {
  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };

  return (
    <span 
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// ============= Dropdown Menu Components =============

interface WidgetDropdownMenuProps {
  children: React.ReactNode;
}

export const WidgetDropdownMenu = ({ children }: WidgetDropdownMenuProps) => {
  return <div className="relative inline-block">{children}</div>;
};

interface WidgetDropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const WidgetDropdownMenuTrigger = ({ 
  children,
  asChild = false 
}: WidgetDropdownMenuTriggerProps) => {
  // If asChild, render children directly (they should handle onClick)
  if (asChild) {
    return <>{children}</>;
  }
  return <>{children}</>;
};

interface WidgetDropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  open?: boolean;
}

export const WidgetDropdownMenuContent = ({ 
  children,
  align = 'end',
  className = '',
  open = false,
}: WidgetDropdownMenuContentProps) => {
  if (!open) return null;

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div 
      className={`absolute mt-2 ${alignClasses[align]} z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-card p-1 shadow-md ${className}`}
    >
      {children}
    </div>
  );
};

interface WidgetDropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const WidgetDropdownMenuItem = ({ 
  children, 
  className = '',
  onClick,
  ...props 
}: WidgetDropdownMenuItemProps) => {
  return (
    <div
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export const WidgetDropdownMenuSeparator = ({ 
  className = '' 
}: { className?: string }) => {
  return (
    <div className={`-mx-1 my-1 h-px bg-border ${className}`} />
  );
};

export const WidgetDropdownMenuLabel = ({ 
  children, 
  className = '' 
}: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`px-2 py-2 text-sm font-semibold ${className}`}>
      {children}
    </div>
  );
};

// ============= Dropdown Menu with State Management =============

interface WidgetDropdownWithStateProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
}

export const WidgetDropdownWithState = ({ 
  trigger, 
  children,
  align = 'end' 
}: WidgetDropdownWithStateProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Clone trigger and add onClick handler
  const triggerWithHandler = React.cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen(!open);
      // Call original onClick if exists
      if (trigger.props.onClick) {
        trigger.props.onClick(e);
      }
    },
  });

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {triggerWithHandler}
      <WidgetDropdownMenuContent open={open} align={align}>
        {/* Clone children and add onClick to close dropdown */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === WidgetDropdownMenuItem) {
            return React.cloneElement(child, {
              onClick: (e: React.MouseEvent) => {
                if (child.props.onClick) {
                  child.props.onClick(e);
                }
                setOpen(false);
              },
            } as any);
          }
          return child;
        })}
      </WidgetDropdownMenuContent>
    </div>
  );
};

// ============= Separator Component =============

export const WidgetSeparator = ({ 
  className = '',
  orientation = 'horizontal'
}: { 
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}) => {
  return (
    <div 
      className={`bg-border ${orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-full'} ${className}`}
    />
  );
};
