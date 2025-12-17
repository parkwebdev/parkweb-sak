/**
 * WidgetCard Component
 * 
 * Lightweight card matching src/components/ui/card.tsx exactly.
 * Simple div wrappers without motion/react dependency.
 * 
 * @module widget/ui/WidgetCard
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card container component.
 * EXACT classes from src/components/ui/card.tsx
 */
const WidgetCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
WidgetCard.displayName = "WidgetCard";

/**
 * Card header component.
 * EXACT classes from src/components/ui/card.tsx
 */
const WidgetCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
WidgetCardHeader.displayName = "WidgetCardHeader";

interface WidgetCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic heading level. Defaults to h3. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Card title component.
 * EXACT classes from src/components/ui/card.tsx
 */
const WidgetCardTitle = React.forwardRef<
  HTMLHeadingElement,
  WidgetCardTitleProps
>(({ className, as: Component = 'h3', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
WidgetCardTitle.displayName = "WidgetCardTitle";

/**
 * Card description component.
 * EXACT classes from src/components/ui/card.tsx
 */
const WidgetCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
WidgetCardDescription.displayName = "WidgetCardDescription";

/**
 * Card content component.
 * EXACT classes from src/components/ui/card.tsx
 */
const WidgetCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
WidgetCardContent.displayName = "WidgetCardContent";

/**
 * Card footer component.
 * EXACT classes from src/components/ui/card.tsx
 */
const WidgetCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
WidgetCardFooter.displayName = "WidgetCardFooter";

export {
  WidgetCard,
  WidgetCardHeader,
  WidgetCardTitle,
  WidgetCardDescription,
  WidgetCardContent,
  WidgetCardFooter,
};
