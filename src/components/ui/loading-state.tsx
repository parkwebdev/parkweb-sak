/**
 * Loading State Component
 * 
 * Spinner-based loading state for page/section-level Suspense fallbacks.
 * For content-aware skeleton loading, use components from skeleton.tsx instead.
 * 
 * @module components/ui/loading-state
 * 
 * @example
 * ```tsx
 * // Page-level Suspense fallback (structure unknown)
 * <Suspense fallback={<LoadingState text="Loading..." />}>
 *   <DynamicPage />
 * </Suspense>
 * ```
 */
import * as React from "react";
import { motion } from "motion/react";
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
  sm: "min-h-[40vh]",
  md: "min-h-[50vh]",
  lg: "min-h-[60vh]",
  xl: "min-h-[70vh]"
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
