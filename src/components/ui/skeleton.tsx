/**
 * Skeleton Components
 * 
 * Animated placeholder components for loading states.
 * Follows ShadCN UI patterns with additional pre-built variants.
 * 
 * @module components/ui/skeleton
 * 
 * @example
 * ```tsx
 * // Basic skeleton
 * <Skeleton className="h-4 w-[200px]" />
 * 
 * // Pre-built templates
 * <SkeletonCard />
 * <SkeletonFormField />
 * <SkeletonTableRow columns={4} />
 * ```
 */

import { cn } from "@/lib/utils";

// =============================================================================
// BASE SKELETON - ShadCN Compatible
// =============================================================================

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// =============================================================================
// PRE-BUILT SKELETON TEMPLATES
// =============================================================================

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")} 
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
  withHeader?: boolean;
  withFooter?: boolean;
}

function SkeletonCard({ className, withHeader = true, withFooter = false }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-4", className)}>
      {withHeader && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      )}
      <SkeletonText lines={2} />
      {withFooter && (
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

function SkeletonAvatar({ size = "md", className }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };
  
  return (
    <Skeleton className={cn("rounded-full", sizeClasses[size], className)} />
  );
}

interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
}

function SkeletonTableRow({ columns = 4, className }: SkeletonTableRowProps) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn("h-4", i === 0 ? "w-1/4" : "flex-1")} 
        />
      ))}
    </div>
  );
}

interface SkeletonListItemProps {
  withAvatar?: boolean;
  withAction?: boolean;
  className?: string;
}

function SkeletonListItem({ withAvatar = false, withAction = false, className }: SkeletonListItemProps) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      {withAvatar && <SkeletonAvatar size="sm" />}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {withAction && <Skeleton className="h-8 w-8 rounded" />}
    </div>
  );
}

interface SkeletonFormFieldProps {
  className?: string;
}

function SkeletonFormField({ className }: SkeletonFormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

// =============================================================================
// SECTION-SPECIFIC SKELETONS
// =============================================================================

/**
 * Skeleton for form-based sections (Appearance, Lead Capture, Welcome Messages)
 */
function SkeletonFormSection({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      {/* Form fields */}
      <div className="space-y-4">
        <SkeletonFormField />
        <SkeletonFormField />
        <div className="flex items-center justify-between py-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
        <SkeletonFormField />
      </div>
    </div>
  );
}

/**
 * Skeleton for table-based sections (Knowledge, Locations, Help Articles)
 */
function SkeletonTableSection({ className, rows = 5 }: { className?: string; rows?: number }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 flex-1 max-w-xs" />
        <Skeleton className="h-9 w-20" />
      </div>
      {/* Table header */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 flex items-center gap-4 bg-muted/30">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border-b last:border-0 px-4">
            <SkeletonTableRow columns={5} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for list-based sections (Custom Tools, Webhooks)
 */
function SkeletonListSection({ className, items = 3 }: { className?: string; items?: number }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-28" />
      </div>
      {/* List items */}
      <div className="space-y-2">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-5 w-9 rounded-full" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for code/installation sections
 */
function SkeletonCodeSection({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-3.5 w-56" />
      </div>
      {/* Code block */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      {/* Copy button */}
      <div className="flex justify-end">
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton for settings cards (Profile, General, Notifications)
 */
function SkeletonSettingsCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="p-6 space-y-1.5 border-b">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for profile settings with avatar
 */
function SkeletonProfileCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <div className="p-6 space-y-1.5 border-b">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="p-6 space-y-4">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <SkeletonAvatar size="lg" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        {/* Form fields */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <SkeletonFormField />
          <SkeletonFormField />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for notification list items
 */
function SkeletonNotificationList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton className="h-4 w-4 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for leads page with stats and content
 */
function SkeletonLeadsPage({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 px-4 lg:px-8 mt-6", className)}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      {/* Content - Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-24" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-lg border bg-card p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ADDITIONAL UTILITY SKELETONS
// =============================================================================

/**
 * Badge skeleton for status indicators
 */
function SkeletonBadge({ width = "w-16", className }: { width?: string; className?: string }) {
  return <Skeleton className={cn("h-5 rounded-full", width, className)} />;
}

/**
 * Chart skeleton for analytics loading
 */
function SkeletonChart({ height = "h-64", className }: { height?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <Skeleton className={cn("w-full rounded-lg", height)} />
    </div>
  );
}

/**
 * Form skeleton with configurable number of fields
 */
function SkeletonForm({ fields = 3, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <SkeletonFormField key={i} />
      ))}
    </div>
  );
}

/**
 * Metric card skeleton for dashboards
 */
function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <SkeletonBadge width="w-12" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

/**
 * Button skeleton
 */
function SkeletonButton({ size = "default", className }: { size?: "sm" | "default" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-9 w-24",
    lg: "h-10 w-28",
  };
  return <Skeleton className={cn("rounded-md", sizeClasses[size], className)} />;
}

/**
 * Input skeleton
 */
function SkeletonInput({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-full rounded-md", className)} />;
}

/**
 * Toggle/Switch skeleton
 */
function SkeletonToggle({ className }: { className?: string }) {
  return <Skeleton className={cn("h-5 w-9 rounded-full", className)} />;
}

/**
 * Icon button skeleton
 */
function SkeletonIconButton({ size = "default", className }: { size?: "sm" | "default"; className?: string }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-9 w-9",
  };
  return <Skeleton className={cn("rounded-md", sizeClasses[size], className)} />;
}

export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonTableRow,
  SkeletonListItem,
  SkeletonFormField,
  SkeletonFormSection,
  SkeletonTableSection,
  SkeletonListSection,
  SkeletonCodeSection,
  SkeletonSettingsCard,
  SkeletonProfileCard,
  SkeletonNotificationList,
  SkeletonLeadsPage,
  SkeletonBadge,
  SkeletonChart,
  SkeletonForm,
  SkeletonMetricCard,
  SkeletonButton,
  SkeletonInput,
  SkeletonToggle,
  SkeletonIconButton,
};
