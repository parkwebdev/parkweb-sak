import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

type LoadingSize = "sm" | "md" | "lg" | "xl";

interface LoadingStateProps {
  size?: LoadingSize;
  text?: string;
  fullPage?: boolean;
  className?: string;
}

const paddingBySize = {
  sm: "py-4",
  md: "py-8",
  lg: "py-12",
  xl: "py-16"
};

export function LoadingState({ 
  size = "lg", 
  text, 
  fullPage = false,
  className 
}: LoadingStateProps) {
  return (
    <div className={cn(
      "flex items-center justify-center",
      fullPage ? "min-h-screen" : paddingBySize[size],
      text && "flex-col gap-2",
      className
    )}>
      <Spinner size={size} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}
