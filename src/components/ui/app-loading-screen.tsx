"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import ChatPadLogo from "@/components/ChatPadLogo";
import { Ripple } from "./ripple";
import { MultiStepLoader } from "./multi-step-loader";

interface AppLoadingScreenProps {
  isLoading: boolean;
  minDisplayTime?: number;
  onLoadingComplete?: () => void;
  className?: string;
}

const loadingStates = [
  { text: "Connecting to workspace..." },
  { text: "Loading your agents..." },
  { text: "Syncing conversations..." },
  { text: "Preparing dashboard..." },
  { text: "Almost ready!" },
];

export function AppLoadingScreen({
  isLoading,
  minDisplayTime = 3000,
  onLoadingComplete,
  className,
}: AppLoadingScreenProps) {
  const [minTimeElapsed, setMinTimeElapsed] = React.useState(false);
  const [shouldShow, setShouldShow] = React.useState(true);

  // Handle minimum display time
  React.useEffect(() => {
    if (isLoading) {
      setMinTimeElapsed(false);
      setShouldShow(true);
      const timer = setTimeout(() => {
        setMinTimeElapsed(true);
      }, minDisplayTime);
      return () => clearTimeout(timer);
    }
  }, [isLoading, minDisplayTime]);

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

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 mb-8"
          >
            <ChatPadLogo className="h-16 w-auto" />
          </motion.div>

          {/* Multi-Step Loader */}
          <div className="relative z-10">
            <MultiStepLoader
              loadingStates={loadingStates}
              loading={shouldShow}
              duration={600}
              loop={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
