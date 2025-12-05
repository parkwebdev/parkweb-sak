import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "text-center py-12 px-8 rounded-lg border border-dashed bg-muted/30",
      className
    )}>
      <div className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        {title}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mb-4">
          {description}
        </p>
      )}
      {action && (
        <div className={cn(!description && "mt-4")}>
          {action}
        </div>
      )}
    </div>
  );
}
