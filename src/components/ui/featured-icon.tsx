/**
 * FeaturedIcon Component
 * 
 * Styled icon container with size and color variants.
 * Used for highlighting icons in cards, empty states, and feature sections.
 * @module components/ui/featured-icon
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const featuredIconVariants = cva(
  "flex items-center justify-center rounded-full",
  {
    variants: {
      size: {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12",
        xl: "w-14 h-14",
      },
      iconColor: {
        gray: "bg-muted border border-border text-muted-foreground",
        primary: "bg-primary/10 border border-primary/20 text-primary",
        success: "bg-success/10 border border-success/20 text-success",
        warning: "bg-warning/10 border border-warning/20 text-warning",
        destructive: "bg-destructive/10 border border-destructive/20 text-destructive",
      },
      theme: {
        modern: "shadow-sm",
        light: "",
        dark: "",
      },
    },
    defaultVariants: {
      size: "md",
      iconColor: "gray",
      theme: "modern",
    },
  }
);

const iconSizeMap = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-7 h-7",
};

export interface FeaturedIconProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof featuredIconVariants> {
  children: React.ReactNode;
  color?: "gray" | "primary" | "success" | "warning" | "destructive";
}

const FeaturedIcon = React.forwardRef<HTMLDivElement, FeaturedIconProps>(
  ({ className, size, color, theme, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(featuredIconVariants({ size, iconColor: color, theme }), className)}
        {...props}
      >
        {React.isValidElement(children)
          ? React.cloneElement(children as React.ReactElement<{ className?: string }>, {
              className: cn(iconSizeMap[size || "md"], (children as React.ReactElement<{ className?: string }>).props.className),
            })
          : children}
      </div>
    );
  }
);
FeaturedIcon.displayName = "FeaturedIcon";

export { FeaturedIcon, featuredIconVariants };
