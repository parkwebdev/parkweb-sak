/**
 * Page-Level Skeleton Components
 * 
 * Full-page skeleton layouts for Suspense fallbacks.
 * Replaces spinner-based LoadingState for better perceived performance.
 * 
 * @module components/ui/page-skeleton
 */

import { cn } from "@/lib/utils";
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTableRow, 
  SkeletonFormField,
  SkeletonSettingsCard,
  SkeletonProfileCard,
} from "./skeleton";

// =============================================================================
// DASHBOARD PAGE SKELETON
// =============================================================================

export function SkeletonDashboardPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      
      {/* Metric cards row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      
      {/* Chart area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TABLE PAGE SKELETON (Leads, etc.)
// =============================================================================

export function SkeletonTablePage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      
      {/* Table */}
      <div className="rounded-lg border">
        {/* Table header */}
        <div className="border-b px-4 py-3 bg-muted/30 flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28 ml-auto" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b last:border-0 px-4">
            <SkeletonTableRow columns={5} />
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SETTINGS PAGE SKELETON
// =============================================================================

export function SkeletonSettingsPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-full", className)}>
      {/* Sidebar */}
      <div className="w-48 border-r p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={cn("h-9 w-full rounded-md", i === 0 && "bg-muted")} />
        ))}
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 space-y-6 max-w-3xl">
        <SkeletonProfileCard />
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
      </div>
    </div>
  );
}

// =============================================================================
// CALENDAR PAGE SKELETON (Planner)
// =============================================================================

export function SkeletonCalendarPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6 h-full", className)}>
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-9" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="rounded-lg border flex-1">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 border-r last:border-0">
              <Skeleton className="h-4 w-12 mx-auto" />
            </div>
          ))}
        </div>
        {/* Calendar cells */}
        {Array.from({ length: 5 }).map((_, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b last:border-0">
            {Array.from({ length: 7 }).map((_, dayIdx) => (
              <div key={dayIdx} className="p-2 border-r last:border-0 min-h-[100px] space-y-1">
                <Skeleton className="h-4 w-6" />
                {weekIdx % 2 === 0 && dayIdx % 3 === 0 && (
                  <Skeleton className="h-5 w-full rounded" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// CHAT PAGE SKELETON (Conversations)
// =============================================================================

export function SkeletonChatPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full", className)}>
      {/* Conversations sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Search */}
        <div className="p-4 border-b">
          <Skeleton className="h-9 w-full" />
        </div>
        {/* Conversation list */}
        <div className="flex-1 p-2 space-y-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={cn("flex items-center gap-3 p-3 rounded-lg", i === 0 && "bg-muted")}>
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-16 w-64 rounded-lg" />
          </div>
          <div className="flex gap-2 justify-end">
            <Skeleton className="h-12 w-48 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-20 w-72 rounded-lg" />
          </div>
        </div>
        {/* Input */}
        <div className="p-4 border-t">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ANALYTICS PAGE SKELETON
// =============================================================================

export function SkeletonAnalyticsPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      
      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// GET STARTED PAGE SKELETON
// =============================================================================

export function SkeletonGetStartedPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-8 max-w-4xl mx-auto", className)}>
      {/* Welcome header */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      
      {/* Progress section */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      
      {/* Checklist items */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ARI CONFIGURATOR PAGE SKELETON
// =============================================================================

export function SkeletonAriConfiguratorPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex-1 h-full bg-muted/30 flex min-h-0", className)}>
      {/* Left: Section Menu */}
      <div className="w-56 border-r bg-background p-3 space-y-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className={cn("h-9 w-full rounded-md", i === 0 && "bg-primary/10")} />
        ))}
      </div>
      
      {/* Center: Content Area */}
      <div className="flex-1 min-w-0 p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          <SkeletonFormField />
          <SkeletonFormField />
          <SkeletonFormField />
        </div>
      </div>
      
      {/* Right: Preview Area */}
      <div className="w-[420px] border-l bg-muted/50 p-6 hidden xl:block">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TEAM TABLE SKELETON
// =============================================================================

export function SkeletonTeamTable({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      {/* Table header */}
      <div className="border-b px-4 py-3 bg-muted/30 flex items-center gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28 ml-auto" />
      </div>
      {/* Table rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b last:border-0 px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-24 ml-auto" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}
