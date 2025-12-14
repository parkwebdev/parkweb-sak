/**
 * Loading State Components
 * 
 * A set of components for displaying loading states with animated
 * spinners, skeletons, and content transitions.
 * 
 * @module components/ui/loading-state
 * 
 * @example
 * ```tsx
 * // Basic loading state
 * <LoadingState text="Loading..." />
 * 
 * // Skeleton list
 * <SkeletonList count={5} />
 * 
 * // Content transition wrapper
 * <ContentTransition isLoading={loading}>{content}</ContentTransition>
 * ```
 */
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { springs, fadeVariants, fadeReducedVariants } from "@/lib/motion-variants";

type LoadingSize = "sm" | "md" | "lg" | "xl";

interface LoadingStateProps {
  size?: LoadingSize;
  text?: string;
  fullPage?: boolean;
  className?: string;
}

const sizeStyles = {
  sm: "min-h-[200px]",
  md: "min-h-[300px]",
  lg: "min-h-[400px]",
  xl: "min-h-[500px]"
};

export function LoadingState({ 
  size = "lg", 
  text, 
  fullPage = false,
  className 
}: LoadingStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div 
      className={cn(
        "flex items-center justify-center",
        fullPage ? "min-h-screen" : sizeStyles[size],
        text && "flex-col gap-2",
        className
      )}
      variants={prefersReducedMotion ? fadeReducedVariants : fadeVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
    >
      <motion.div
        animate={prefersReducedMotion ? {} : { 
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Spinner size={size} aria-hidden="true" />
      </motion.div>
      {text && (
        <motion.p 
          className="text-sm text-muted-foreground"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ...springs.smooth }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}

// =============================================================================
// SKELETON COMPONENTS WITH STAGGER ANIMATION
// =============================================================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  );
}

interface SkeletonListProps {
  count?: number;
  className?: string;
  itemClassName?: string;
}

export function SkeletonList({ 
  count = 3, 
  className,
  itemClassName = "h-12"
}: SkeletonListProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: springs.smooth 
    },
  };

  const reducedItemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0 } },
  };

  return (
    <motion.div 
      className={cn("space-y-3", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          variants={prefersReducedMotion ? reducedItemVariants : itemVariants}
        >
          <Skeleton className={cn("w-full", itemClassName)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

// =============================================================================
// CONTENT TRANSITION WRAPPER
// =============================================================================

interface ContentTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  className?: string;
}

export function ContentTransition({
  isLoading,
  children,
  loadingComponent,
  className,
}: ContentTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            variants={prefersReducedMotion ? fadeReducedVariants : fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {loadingComponent || <LoadingState />}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            variants={prefersReducedMotion ? fadeReducedVariants : fadeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
