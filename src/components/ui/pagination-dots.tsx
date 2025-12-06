import * as React from "react";
import { cn } from "@/lib/utils";

interface PaginationDotsProps {
  total: number;
  current: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

const PaginationDots = React.forwardRef<HTMLDivElement, PaginationDotsProps>(
  ({ total, current, size = "md", className }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)}>
        {Array.from({ length: total }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "rounded-full transition-colors",
              sizeMap[size],
              index === current
                ? "bg-primary"
                : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>
    );
  }
);
PaginationDots.displayName = "PaginationDots";

export { PaginationDots };
