/**
 * Card Components
 * 
 * A set of card components for displaying content in a contained,
 * visually distinct container. Includes static and motion variants.
 * 
 * @module components/ui/card
 * 
 * @example
 * ```tsx
 * // Static card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *     <CardDescription>Description</CardDescription>
 *   </CardHeader>
 *   <CardContent>Content</CardContent>
 *   <CardFooter>Footer</CardFooter>
 * </Card>
 * 
 * // Motion card with hover effects
 * <MotionCard hoverEffect tapEffect>
 *   Interactive content
 * </MotionCard>
 * ```
 */
import * as React from "react"
import { motion, type HTMLMotionProps } from "motion/react"

import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { springs } from "@/lib/motion-variants"

// =============================================================================
// STATIC CARD COMPONENTS (Original)
// =============================================================================

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-card border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Semantic heading level for accessibility. Defaults to h3. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  CardTitleProps
>(({ className, as: Component = 'h3', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// =============================================================================
// MOTION CARD COMPONENT (Interactive with hover effects)
// =============================================================================

interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  /** Enable hover lift animation */
  hoverEffect?: boolean
  /** Enable tap scale animation */
  tapEffect?: boolean
  /** Enable layout animations */
  layout?: boolean | "position" | "size"
  /** Custom hover scale (default: 1.01) */
  hoverScale?: number
  /** Custom hover Y offset (default: -2) */
  hoverY?: number
}

const MotionCard = React.forwardRef<HTMLDivElement, MotionCardProps>(
  ({ 
    className, 
    hoverEffect = true, 
    tapEffect = false,
    layout = false,
    hoverScale = 1.01,
    hoverY = -2,
    ...props 
  }, ref) => {
    const prefersReducedMotion = useReducedMotion()

    const motionProps = prefersReducedMotion ? {} : {
      whileHover: hoverEffect ? { 
        scale: hoverScale, 
        y: hoverY,
        transition: springs.micro 
      } : undefined,
      whileTap: tapEffect ? { 
        scale: 0.99,
        transition: springs.micro 
      } : undefined,
      layout,
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-card border bg-card text-card-foreground shadow-sm",
          hoverEffect && "cursor-pointer",
          className
        )}
        {...motionProps}
        {...props}
      />
    )
  }
)
MotionCard.displayName = "MotionCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  MotionCard 
}
