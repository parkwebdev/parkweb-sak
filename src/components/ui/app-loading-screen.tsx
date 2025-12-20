/**
 * AppLoadingScreen Component
 * 
 * Full-screen loading overlay with animated logo and ripple effects.
 * Displays after user sign-in with minimum display time for smooth animation.
 * Features liquid-fill logo animation and ripple background.
 * @module components/ui/app-loading-screen
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { Ripple } from "./ripple";

interface AppLoadingScreenProps {
  isLoading: boolean;
  minDisplayTime?: number;
  onLoadingComplete?: () => void;
  className?: string;
}

// Star icon SVG path for the animated logo
const StarIconPath = "M78.54 38.42c0 .58-.47 1.06-1.06 1.06h-4.93c-3.45 0-6.85.54-10.07 1.58-4.89 1.58-7.21 7.05-4.89 11.55 1.53 2.96 3.53 5.69 5.98 8.08l3.46 3.39c.42.42.42 1.1 0 1.51l-.02.02c-.41.4-1.07.4-1.48 0l-3.49-3.42a32.4 32.4 0 0 0-8.26-5.85c-4.6-2.27-10.2 0-11.81 4.78a30.9 30.9 0 0 0-1.62 9.85v4.8c0 .58-.47 1.06-1.06 1.06h-.05c-.58 0-1.06-.47-1.06-1.06v-4.8c0-3.38-.56-6.7-1.62-9.85-1.61-4.79-7.21-7.05-11.81-4.78a32 32 0 0 0-8.26 5.85L13 65.61c-.41.4-1.07.4-1.48 0l-.02-.02c-.42-.42-.42-1.1 0-1.51l3.46-3.39c2.44-2.39 4.45-5.12 5.98-8.08 2.32-4.5 0-9.97-4.89-11.55a32.8 32.8 0 0 0-10.07-1.58H1.06a1.06 1.06 0 0 1 0-2.12h4.93c3.45 0 6.85-.54 10.07-1.58 4.89-1.58 7.21-7.05 4.89-11.55a31.4 31.4 0 0 0-5.98-8.08l-3.46-3.39c-.42-.42-.42-1.1 0-1.51l.02-.02c.41-.4 1.07-.4 1.48 0l3.49 3.42a32.4 32.4 0 0 0 8.26 5.85c4.6 2.27 10.2 0 11.81-4.78 1.06-3.15 1.62-6.47 1.62-9.85V1.06c0-.58.47-1.06 1.06-1.06h.05c.58 0 1.06.47 1.06 1.06v4.8c0 3.38.56 6.7 1.62 9.85 1.61 4.79 7.21 7.05 11.81 4.78 3.03-1.49 5.82-3.46 8.26-5.85l3.49-3.42c.41-.4 1.07-.4 1.48 0l.02.02c.42.42.42 1.1 0 1.51l-3.46 3.39a31.7 31.7 0 0 0-5.98 8.08c-2.32 4.5 0 9.97 4.89 11.55 3.22 1.04 6.62 1.58 10.07 1.58h4.93c.58 0 1.06.47 1.06 1.06Z";

// Animated logo with liquid fill effect
const AnimatedLogo = () => {
  return (
    <div className="relative w-14 h-14">
      {/* Base layer - muted version */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 78.54 76.83"
        className="absolute inset-0 w-full h-full text-muted-foreground/30"
        fill="currentColor"
      >
        <path d={StarIconPath} />
      </svg>

      {/* Fill layer - vibrant with animated clipPath */}
      <motion.div
        className="absolute inset-0"
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        animate={{ clipPath: "inset(0% 0 0 0)" }}
        transition={{
          duration: 2,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.3,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 78.54 76.83"
          className="w-full h-full text-primary"
          fill="currentColor"
        >
          <path d={StarIconPath} />
        </svg>
      </motion.div>
    </div>
  );
};

export function AppLoadingScreen({
  isLoading,
  minDisplayTime = 2500,
  onLoadingComplete,
  className,
}: AppLoadingScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);
  const [shouldShow, setShouldShow] = React.useState(true);
  const timerStartedRef = React.useRef(false);

  // Start timer immediately on mount (only once)
  React.useEffect(() => {
    if (timerStartedRef.current) return;
    timerStartedRef.current = true;

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime]);

  // Handle visibility based on loading state and min time
  React.useEffect(() => {
    if (!isLoading && minTimeElapsed) {
      setShouldShow(false);
    }
  }, [isLoading, minTimeElapsed]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        onLoadingComplete?.();
      }}
    >
      {shouldShow && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0 }}
          className={cn(
            "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden",
            className
          )}
        >
          {/* Ripple Background */}
          <Ripple
            mainCircleSize={180}
            mainCircleOpacity={0.2}
            numCircles={10}
          />

          {/* Animated Logo with Liquid Fill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10"
          >
            <AnimatedLogo />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
