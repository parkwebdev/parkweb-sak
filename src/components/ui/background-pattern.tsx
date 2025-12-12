/**
 * BackgroundPattern Component
 * 
 * SVG-based decorative background patterns for visual interest.
 * Supports grid and dots patterns with size variants.
 * @module components/ui/background-pattern
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface BackgroundPatternProps extends React.HTMLAttributes<HTMLDivElement> {
  pattern?: "grid" | "dots";
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-32 h-32",
  md: "w-48 h-48",
  lg: "w-64 h-64",
};

const BackgroundPattern = React.forwardRef<HTMLDivElement, BackgroundPatternProps>(
  ({ className, pattern = "grid", size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(sizeMap[size], "pointer-events-none", className)}
        {...props}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="fadeGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
              <stop offset="70%" stopColor="currentColor" stopOpacity="0.08" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          {pattern === "grid" && (
            <g fill="url(#fadeGradient)">
              {Array.from({ length: 11 }).map((_, row) =>
                Array.from({ length: 11 }).map((_, col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={20 + col * 16}
                    cy={20 + row * 16}
                    r="1.5"
                  />
                ))
              )}
            </g>
          )}
          {pattern === "dots" && (
            <g fill="url(#fadeGradient)">
              {Array.from({ length: 7 }).map((_, row) =>
                Array.from({ length: 7 }).map((_, col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={30 + col * 24}
                    cy={30 + row * 24}
                    r="2"
                  />
                ))
              )}
            </g>
          )}
        </svg>
      </div>
    );
  }
);
BackgroundPattern.displayName = "BackgroundPattern";

export { BackgroundPattern };
