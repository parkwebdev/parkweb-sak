/**
 * WidgetSkeleton Components
 * 
 * Lightweight skeleton components for widget loading states.
 * Matches the main app skeleton patterns but optimized for widget bundle.
 * 
 * @module widget/ui/WidgetSkeleton
 */

import { cn } from "@/lib/utils";

interface WidgetSkeletonProps {
  className?: string;
}

export function WidgetSkeleton({ className }: WidgetSkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}

export function WidgetSkeletonText({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <WidgetSkeleton 
          key={i} 
          className={cn("h-3", i === lines - 1 ? "w-3/4" : "w-full")} 
        />
      ))}
    </div>
  );
}

export function WidgetSkeletonMessage({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      {!isUser && <WidgetSkeleton className="h-8 w-8 rounded-full shrink-0" />}
      <div className={cn("space-y-2 flex-1", isUser ? "items-end" : "items-start")}>
        <WidgetSkeleton className={cn("h-16 rounded-lg", isUser ? "w-2/3 ml-auto" : "w-3/4")} />
      </div>
    </div>
  );
}

export function WidgetSkeletonChatView() {
  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <WidgetSkeletonMessage />
      <WidgetSkeletonMessage isUser />
      <WidgetSkeletonMessage />
    </div>
  );
}

export function WidgetSkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-3">
      <WidgetSkeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <WidgetSkeleton className="h-3.5 w-2/3" />
        <WidgetSkeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
