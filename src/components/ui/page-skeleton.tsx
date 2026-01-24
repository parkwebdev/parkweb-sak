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
// CHAT PAGE SKELETON (Conversations)
// =============================================================================

export function SkeletonChatPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full", className)}>
      {/* Conversation list sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Search */}
        <div className="p-4 border-b">
          <Skeleton className="h-9 w-full" />
        </div>
        {/* Conversation items */}
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
              <div className="max-w-[60%] space-y-1">
                <Skeleton className={cn("h-12 rounded-lg", i % 2 === 0 ? "w-48" : "w-64")} />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="p-4 border-t">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CALENDAR PAGE SKELETON
// =============================================================================

export function SkeletonCalendarPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="rounded-lg border">
        {/* Week header */}
        <div className="grid grid-cols-7 border-b">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 text-center border-r last:border-0">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>
        {/* Calendar cells */}
        {Array.from({ length: 5 }).map((_, week) => (
          <div key={week} className="grid grid-cols-7 border-b last:border-0">
            {Array.from({ length: 7 }).map((_, day) => (
              <div key={day} className="p-2 h-24 border-r last:border-0 space-y-1">
                <Skeleton className="h-4 w-6" />
                {(week + day) % 3 === 0 && <Skeleton className="h-5 w-full" />}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// SETTINGS PAGE SKELETON
// =============================================================================

export function SkeletonSettingsPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      
      {/* Content */}
      <div className="space-y-6">
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
        <SkeletonProfileCard />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      
      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-[250px] w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ARI CONFIGURATOR PAGE SKELETON
// =============================================================================

export function SkeletonAriConfiguratorPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full", className)}>
      {/* Left sidebar - section menu */}
      <div className="w-64 border-r p-4 space-y-2">
        <Skeleton className="h-6 w-32 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      
      {/* Main content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
      
      {/* Right sidebar - preview */}
      <div className="w-80 border-l p-4">
        <Skeleton className="h-5 w-24 mb-4" />
        <Skeleton className="h-[500px] w-full rounded-lg" />
      </div>
    </div>
  );
}

// =============================================================================
// GET STARTED PAGE SKELETON
// =============================================================================

export function SkeletonGetStartedPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-8", className)}>
      {/* Header */}
      <div className="space-y-2 text-center">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>
      
      {/* Progress */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      
      {/* Steps */}
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ADMIN PAGE SKELETON
// =============================================================================

export function SkeletonAdminPage({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ))}
      </div>
      
      {/* Table */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 bg-muted/30 flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28 ml-auto" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b last:border-0 px-4">
            <SkeletonTableRow columns={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// DETAIL SHEET SKELETONS
// =============================================================================

export function SkeletonLeadDetails({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Contact info */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
      
      {/* Activity */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonArticleDetails({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Featured image */}
      <Skeleton className="h-40 w-full rounded-lg" />
      
      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Metadata */}
      <div className="flex items-center gap-4 pt-4 border-t">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export function SkeletonKnowledgeDetails({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Status */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      
      {/* Content preview */}
      <div className="space-y-2 p-3 rounded-lg border">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function SkeletonLocationDetails({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Address */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
      
      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-40" />
        </div>
      </div>
      
      {/* Hours */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTeamTable({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border", className)}>
      {/* Header */}
      <div className="border-b px-4 py-3 bg-muted/30 flex items-center gap-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border-b last:border-0 px-4 py-3 flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonHeatmap({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      
      {/* Heatmap grid */}
      <div className="space-y-1">
        {/* X-axis labels */}
        <div className="flex gap-1 pl-16">
          {Array.from({ length: 24 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-4 flex-1" />
          ))}
        </div>
        
        {/* Rows */}
        {Array.from({ length: 7 }).map((_, row) => (
          <div key={row} className="flex items-center gap-1">
            <Skeleton className="h-4 w-14" />
            <div className="flex gap-1 flex-1">
              {Array.from({ length: 24 }).map((_, col) => (
                <Skeleton key={col} className="h-6 flex-1 rounded-sm" />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-24 rounded-sm" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}
