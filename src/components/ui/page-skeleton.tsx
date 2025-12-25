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

// =============================================================================
// DETAIL SHEET SKELETONS
// =============================================================================

/**
 * Lead details sheet skeleton
 */
export function SkeletonLeadDetails({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header with avatar */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      {/* Status badge */}
      <Skeleton className="h-6 w-20 rounded-full" />
      {/* Contact info */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      {/* Notes section */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
      {/* Actions */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

/**
 * Location details sheet skeleton
 */
export function SkeletonLocationDetails({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Address */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Contact info */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>
      {/* Business hours */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Knowledge source details skeleton
 */
export function SkeletonKnowledgeDetails({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      {/* Status */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Source URL/Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      {/* Metadata */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
      {/* Content preview */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    </div>
  );
}

/**
 * Article details skeleton
 */
export function SkeletonArticleDetails({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {/* Featured image */}
      <Skeleton className="h-48 w-full rounded-lg" />
      {/* Content editor */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <div className="rounded-md border p-4 space-y-2">
          <div className="flex gap-1 pb-2 border-b">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ARI SECTION SKELETONS
// =============================================================================

/**
 * Knowledge section skeleton for Ari configurator
 */
export function SkeletonKnowledgeSection({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Add button */}
      <Skeleton className="h-9 w-36" />
      {/* Knowledge cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Help articles section skeleton
 */
export function SkeletonHelpArticlesSection({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Categories */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border">
            <div className="p-4 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="p-2 space-y-1">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2 p-2 rounded">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Model behavior section skeleton
 */
export function SkeletonModelBehaviorSection({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* Model selector */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      {/* Temperature slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      {/* Max tokens */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      {/* System prompt */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-40 w-full rounded-md" />
      </div>
    </div>
  );
}

// =============================================================================
// CHART SKELETONS
// =============================================================================

/**
 * Line chart skeleton
 */
export function SkeletonLineChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="relative h-[250px] w-full">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
        {/* Chart area */}
        <div className="ml-12 h-full border-l border-b flex items-end justify-around gap-2 px-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <Skeleton 
                className="w-full rounded-t" 
                style={{ height: `${Math.random() * 60 + 20}%` }}
              />
            </div>
          ))}
        </div>
        {/* X-axis labels */}
        <div className="ml-12 flex justify-around mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Bar chart skeleton
 */
export function SkeletonBarChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="h-[200px] flex items-end justify-around gap-3 px-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <Skeleton 
              className="w-full rounded-t max-w-[40px]" 
              style={{ height: `${Math.random() * 70 + 30}%` }}
            />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pie/Donut chart skeleton
 */
export function SkeletonPieChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      <Skeleton className="h-5 w-28" />
      <div className="flex items-center justify-center gap-8">
        {/* Pie chart circle */}
        <Skeleton className="h-40 w-40 rounded-full" />
        {/* Legend */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Heatmap skeleton for analytics
 */
export function SkeletonHeatmap({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      <Skeleton className="h-5 w-36" />
      <div className="space-y-1">
        {Array.from({ length: 7 }).map((_, row) => (
          <div key={row} className="flex gap-1">
            <Skeleton className="h-4 w-12 shrink-0" />
            {Array.from({ length: 24 }).map((_, col) => (
              <Skeleton 
                key={col} 
                className="h-6 flex-1 rounded-sm"
                style={{ opacity: Math.random() * 0.5 + 0.3 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
