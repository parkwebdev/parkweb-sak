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

// Animated logo with liquid fill effect
const AnimatedLogo = () => {
  return (
    <div className="relative w-20 h-20">
      {/* Base layer - muted version */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 270.69 270.02"
        className="absolute inset-0 w-full h-full text-muted-foreground/30"
        fill="currentColor"
      >
        <g>
          <path d="M135.35,0C60.59,0,0,60.44,0,135.02s60.59,135,135.35,135,135.35-60.44,135.35-135S210.1,0,135.35,0ZM135.35,241.44c-58.96,0-106.7-47.62-106.7-106.43S76.38,28.57,135.35,28.57s106.7,47.63,106.7,106.44-47.74,106.43-106.7,106.43Z" />
          <path d="M86.78,166.62c9.45,48.43,79.49,46.38,94.14,9.97,3.46-8.6,8.57-27.67-15.49-17.93-22.19,9.02-53.36,37.06-78.66,7.96h.01Z" />
        </g>
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
          viewBox="0 0 270.69 270.02"
          className="w-full h-full text-primary"
          fill="currentColor"
        >
          <g>
            <path d="M135.35,0C60.59,0,0,60.44,0,135.02s60.59,135,135.35,135,135.35-60.44,135.35-135S210.1,0,135.35,0ZM135.35,241.44c-58.96,0-106.7-47.62-106.7-106.43S76.38,28.57,135.35,28.57s106.7,47.63,106.7,106.44-47.74,106.43-106.7,106.43Z" />
            <path d="M86.78,166.62c9.45,48.43,79.49,46.38,94.14,9.97,3.46-8.6,8.57-27.67-15.49-17.93-22.19,9.02-53.36,37.06-78.66,7.96h.01Z" />
          </g>
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
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
