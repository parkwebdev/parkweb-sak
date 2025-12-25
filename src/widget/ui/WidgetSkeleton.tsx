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

/** Quick action card skeleton for HomeView */
export function WidgetSkeletonCard({ className }: WidgetSkeletonProps = {}) {
  return (
    <div className={cn("p-4 border rounded-lg animate-pulse", className)}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted w-10 h-10" />
        <div className="flex-1 space-y-2">
          <WidgetSkeleton className="h-4 w-24" />
          <WidgetSkeleton className="h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

/** Article content skeleton for NewsView/HelpView */
export function WidgetSkeletonArticleContent({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <WidgetSkeleton 
          key={i} 
          className={cn(
            "h-4",
            i === 0 ? "w-full" : i === 1 ? "w-3/4" : "w-5/6"
          )} 
        />
      ))}
    </div>
  );
}

/** Welcome header skeleton for HomeView */
export function WidgetSkeletonWelcome() {
  return (
    <div className="space-y-2">
      <WidgetSkeleton className="h-8 w-24 bg-foreground/20" />
      <WidgetSkeleton className="h-5 w-48 bg-foreground/20" />
    </div>
  );
}

/** Booking component skeleton for Suspense fallback */
export function WidgetSkeletonBooking() {
  return (
    <div className="h-32 animate-pulse bg-muted rounded-xl mt-2" />
  );
}

/** Link preview skeleton */
export function WidgetSkeletonLinkPreview() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 animate-pulse">
      <WidgetSkeleton className="h-3 w-24 mb-2" />
      <WidgetSkeleton className="h-4 w-3/4 mb-1" />
      <WidgetSkeleton className="h-3 w-full" />
    </div>
  );
}

/** Full widget loading skeleton (replaces spinner) */
export function WidgetSkeletonLoader() {
  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header skeleton */}
      <div className="p-4 border-b flex items-center gap-3">
        <WidgetSkeleton className="h-8 w-8 rounded-full" />
        <WidgetSkeleton className="h-5 w-24" />
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-4 space-y-4">
        <WidgetSkeletonMessage />
        <WidgetSkeletonMessage isUser />
        <WidgetSkeletonMessage />
      </div>
      {/* Input skeleton */}
      <div className="p-4 border-t">
        <WidgetSkeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

/** View loading skeleton for lazy-loaded views (Help, News) */
export function WidgetSkeletonView() {
  return (
    <div className="flex-1 p-4 space-y-4">
      <WidgetSkeleton className="h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <WidgetSkeletonListItem key={i} />
        ))}
      </div>
    </div>
  );
}

/** Category section skeleton for HelpView */
export function WidgetSkeletonCategory() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2">
        <WidgetSkeleton className="h-5 w-5" />
        <WidgetSkeleton className="h-4 w-32" />
      </div>
      <div className="pl-7 space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <WidgetSkeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/** News item skeleton for NewsView */
export function WidgetSkeletonNewsItem() {
  return (
    <div className="p-4 border-b space-y-3">
      <div className="flex items-center gap-2">
        <WidgetSkeleton className="h-6 w-6 rounded-full" />
        <WidgetSkeleton className="h-3 w-24" />
      </div>
      <WidgetSkeleton className="h-5 w-3/4" />
      <WidgetSkeleton className="h-32 w-full rounded-lg" />
      <WidgetSkeletonText lines={2} />
    </div>
  );
}

/** Conversation list item skeleton for MessagesView */
export function WidgetSkeletonConversationItem() {
  return (
    <div className="flex items-center gap-3 p-3 border-b">
      <WidgetSkeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <WidgetSkeleton className="h-4 w-24" />
          <WidgetSkeleton className="h-3 w-12" />
        </div>
        <WidgetSkeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
