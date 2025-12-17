/**
 * WidgetSelect Compound Component
 * 
 * Lightweight replacement for @radix-ui/react-select with exact API matching.
 * Uses React Context for state, portal rendering, click-outside detection,
 * and keyboard navigation. Zero heavy dependencies.
 * 
 * @module widget/ui/WidgetSelect
 */

import * as React from "react";
import * as ReactDOM from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ============================================================================
// Context
// ============================================================================

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  displayText: string;
  setDisplayText: (text: string) => void;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("WidgetSelect components must be used within a WidgetSelect");
  }
  return context;
}

// ============================================================================
// WidgetSelect (Root)
// ============================================================================

interface WidgetSelectProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const WidgetSelect = React.forwardRef<HTMLDivElement, WidgetSelectProps>(
  ({ 
    children, 
    value: controlledValue, 
    defaultValue = "", 
    onValueChange,
    name,
    required,
    disabled,
    open: controlledOpen,
    onOpenChange
  }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
    const [displayText, setDisplayText] = React.useState("");
    
    const isControlled = controlledValue !== undefined;
    const isOpenControlled = controlledOpen !== undefined;
    
    const value = isControlled ? controlledValue : uncontrolledValue;
    const open = isOpenControlled ? controlledOpen : uncontrolledOpen;
    
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const handleValueChange = React.useCallback((newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    }, [isControlled, onValueChange]);

    const handleOpenChange = React.useCallback((newOpen: boolean) => {
      if (disabled && newOpen) return;
      if (!isOpenControlled) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    }, [disabled, isOpenControlled, onOpenChange]);

    return (
      <SelectContext.Provider
        value={{
          value,
          onValueChange: handleValueChange,
          open,
          setOpen: handleOpenChange,
          triggerRef,
          contentRef,
          name,
          required,
          disabled,
          displayText,
          setDisplayText,
        }}
      >
        <div ref={ref} className="relative">
          {children}
          {/* Hidden input for form submission */}
          {name && (
            <input
              type="hidden"
              name={name}
              value={value}
              required={required}
            />
          )}
        </div>
      </SelectContext.Provider>
    );
  }
);
WidgetSelect.displayName = "WidgetSelect";

// ============================================================================
// WidgetSelectTrigger
// ============================================================================

const widgetSelectTriggerVariants = cva(
  "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      size: {
        default: "h-10 py-2 text-sm",
        sm: "h-8 py-1 text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

interface WidgetSelectTriggerProps 
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof widgetSelectTriggerVariants> {}

const WidgetSelectTrigger = React.forwardRef<HTMLButtonElement, WidgetSelectTriggerProps>(
  ({ className, size, children, ...props }, forwardedRef) => {
    const { open, setOpen, triggerRef, disabled } = useSelectContext();

    // Merge refs
    const ref = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [triggerRef, forwardedRef]
    );

    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className={cn(widgetSelectTriggerVariants({ size }), className)}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        {...props}
      >
        {children}
        {/* Chevron icon - inline SVG */}
        <svg
          className="h-4 w-4 opacity-50 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    );
  }
);
WidgetSelectTrigger.displayName = "WidgetSelectTrigger";

// ============================================================================
// WidgetSelectValue
// ============================================================================

interface WidgetSelectValueProps {
  placeholder?: string;
  className?: string;
}

const WidgetSelectValue = React.forwardRef<HTMLSpanElement, WidgetSelectValueProps>(
  ({ placeholder, className }, ref) => {
    const { value, displayText } = useSelectContext();
    
    return (
      <span 
        ref={ref}
        className={cn(
          "pointer-events-none",
          !value && "text-muted-foreground",
          className
        )}
      >
        {displayText || value || placeholder}
      </span>
    );
  }
);
WidgetSelectValue.displayName = "WidgetSelectValue";

// ============================================================================
// WidgetSelectContent
// ============================================================================

interface WidgetSelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: "popper" | "item-aligned";
}

const WidgetSelectContent = React.forwardRef<HTMLDivElement, WidgetSelectContentProps>(
  ({ children, className, position = "popper" }, forwardedRef) => {
    const { open, setOpen, triggerRef, contentRef } = useSelectContext();
    const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const itemsRef = React.useRef<HTMLDivElement[]>([]);

    // Merge refs
    const ref = React.useCallback(
      (node: HTMLDivElement | null) => {
        (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [contentRef, forwardedRef]
    );

    // Calculate position when open
    React.useEffect(() => {
      if (open && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    }, [open, triggerRef]);

    // Click outside detection
    React.useEffect(() => {
      if (!open) return;

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          contentRef.current && !contentRef.current.contains(target) &&
          triggerRef.current && !triggerRef.current.contains(target)
        ) {
          setOpen(false);
        }
      };

      // Delay to avoid immediate close on trigger click
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open, setOpen, contentRef, triggerRef]);

    // Keyboard navigation
    React.useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        const items = itemsRef.current.filter(Boolean);
        
        switch (e.key) {
          case "Escape":
            e.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            break;
          case "ArrowDown":
            e.preventDefault();
            setFocusedIndex((prev) => {
              const next = prev < items.length - 1 ? prev + 1 : 0;
              items[next]?.focus();
              return next;
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            setFocusedIndex((prev) => {
              const next = prev > 0 ? prev - 1 : items.length - 1;
              items[next]?.focus();
              return next;
            });
            break;
          case "Home":
            e.preventDefault();
            setFocusedIndex(0);
            items[0]?.focus();
            break;
          case "End":
            e.preventDefault();
            setFocusedIndex(items.length - 1);
            items[items.length - 1]?.focus();
            break;
          case "Tab":
            e.preventDefault();
            setOpen(false);
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, setOpen, triggerRef]);

    // Reset focus index when closed
    React.useEffect(() => {
      if (!open) {
        setFocusedIndex(-1);
        itemsRef.current = [];
      }
    }, [open]);

    if (!open) return null;

    const content = (
      <div
        ref={ref}
        role="listbox"
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        style={{
          position: "fixed",
          top: coords.top,
          left: coords.left,
          width: coords.width,
        }}
        data-state={open ? "open" : "closed"}
      >
        <div className="p-1 flex flex-col gap-0.5">
          <SelectContentContext.Provider value={{ itemsRef, focusedIndex }}>
            {children}
          </SelectContentContext.Provider>
        </div>
      </div>
    );

    return ReactDOM.createPortal(content, document.body);
  }
);
WidgetSelectContent.displayName = "WidgetSelectContent";

// Context for managing item refs for keyboard nav
interface SelectContentContextType {
  itemsRef: React.MutableRefObject<HTMLDivElement[]>;
  focusedIndex: number;
}

const SelectContentContext = React.createContext<SelectContentContextType | null>(null);

// ============================================================================
// WidgetSelectItem
// ============================================================================

interface WidgetSelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

const WidgetSelectItem = React.forwardRef<HTMLDivElement, WidgetSelectItemProps>(
  ({ className, value, disabled, children, ...props }, forwardedRef) => {
    const { value: selectedValue, onValueChange, setOpen, triggerRef, setDisplayText } = useSelectContext();
    const contentContext = React.useContext(SelectContentContext);
    const internalRef = React.useRef<HTMLDivElement>(null);
    const isSelected = selectedValue === value;

    // Register item ref for keyboard navigation
    React.useEffect(() => {
      if (contentContext && internalRef.current) {
        const items = contentContext.itemsRef.current;
        if (!items.includes(internalRef.current)) {
          items.push(internalRef.current);
        }
      }
    }, [contentContext]);

    // Merge refs
    const ref = React.useCallback(
      (node: HTMLDivElement | null) => {
        (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    const handleSelect = () => {
      if (disabled) return;
      onValueChange(value);
      // Set display text from children
      const text = typeof children === 'string' ? children : value;
      setDisplayText(text);
      setOpen(false);
      triggerRef.current?.focus();
    };

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        aria-disabled={disabled}
        data-state={isSelected ? "checked" : "unchecked"}
        data-disabled={disabled ? "" : undefined}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect();
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
WidgetSelectItem.displayName = "WidgetSelectItem";

// ============================================================================
// Exports
// ============================================================================

export {
  WidgetSelect,
  WidgetSelectTrigger,
  WidgetSelectValue,
  WidgetSelectContent,
  WidgetSelectItem,
  widgetSelectTriggerVariants,
};
