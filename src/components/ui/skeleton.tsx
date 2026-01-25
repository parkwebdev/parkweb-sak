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
    <div className={cn("rounded-card border bg-card p-4 space-y-4", className)}>
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
      <div className="rounded-card border">
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
          <div key={i} className="rounded-card border bg-card p-4">
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
    <div className={cn("rounded-card border bg-card", className)}>
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
    <div className={cn("rounded-card border bg-card", className)}>
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
 * Skeleton for leads page table view
 */
function SkeletonLeadsTableView({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Table */}
      <div className="rounded-card border">
        {/* Table header */}
        <div className="border-b px-4 py-3 bg-muted/30 flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28 ml-auto" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b last:border-0 px-4">
            <SkeletonTableRow columns={6} />
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

/**
 * Skeleton for leads page kanban view
 */
function SkeletonLeadsKanbanView({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72 space-y-3">
            {/* Column header */}
            <div className="flex items-center gap-2 px-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            {/* Column cards */}
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="rounded-card border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for leads page with stats and content.
 * Automatically detects view mode from localStorage to show matching skeleton.
 */
interface SkeletonLeadsPageProps {
  className?: string;
  /** Override the view mode (otherwise reads from localStorage) */
  viewMode?: 'kanban' | 'table';
}

function SkeletonLeadsPage({ className, viewMode }: SkeletonLeadsPageProps) {
  // Determine view mode: prop > localStorage > default to kanban
  const effectiveViewMode = viewMode ?? (() => {
    try {
      const stored = localStorage.getItem('leads-view-mode');
      if (stored === 'table' || stored === 'kanban') return stored;
    } catch {
      // localStorage not available
    }
    return 'kanban';
  })();

  return (
    <div className={cn("space-y-6", className)}>
      {effectiveViewMode === 'table' ? (
        <SkeletonLeadsTableView />
      ) : (
        <SkeletonLeadsKanbanView />
      )}
    </div>
  );
}

/**
 * Skeleton for news section with cards
 */
function SkeletonNewsSection({ items = 3, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* News cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="rounded-card border bg-card overflow-hidden">
            {/* Featured image placeholder */}
            <Skeleton className="h-32 w-full" />
            <div className="p-4 space-y-3">
              {/* Title */}
              <Skeleton className="h-5 w-3/4" />
              {/* Excerpt */}
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
              </div>
              {/* Author and date */}
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for integrations section with tabs and cards
 */
function SkeletonIntegrationsSection({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      
      {/* Integration cards */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3 rounded-card border bg-card">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
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
  return <Skeleton className={cn("h-5 rounded-md", width, className)} />;
}

/**
 * Chart skeleton for analytics loading
 */
function SkeletonChart({ height = "h-64", className }: { height?: string; className?: string }) {
  return (
    <div className={cn("rounded-card border bg-card p-4 space-y-3", className)}>
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
    <div className={cn("rounded-card border bg-card p-4 space-y-3", className)}>
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

/**
 * Conversation list skeleton for inbox sidebar
 */
function SkeletonConversationList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-3 flex items-start gap-3">
          <SkeletonAvatar size="sm" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Message thread skeleton for chat messages
 */
function SkeletonMessageThread({ messages = 4, className }: { messages?: number; className?: string }) {
  return (
    <div className={cn("space-y-4 px-6 py-4", className)}>
      {Array.from({ length: messages }).map((_, i) => {
        const isUser = i % 2 === 0;
        return (
          <div key={i} className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser && <SkeletonAvatar size="sm" />}
            <div className={cn("space-y-2 max-w-[70%]", isUser ? "items-end" : "items-start")}>
              <Skeleton className={cn("h-16 rounded-2xl", isUser ? "w-48" : "w-56")} />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * User account card skeleton for sidebar (always expanded)
 */
function SkeletonUserCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-[11px]", className)}>
      <SkeletonAvatar size="sm" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

/**
 * Search results skeleton for global search
 */
function SkeletonSearchResults({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn("py-2", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="h-4 w-4 rounded" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Kanban column skeleton for leads board loading state
 */
function SkeletonKanbanColumn({ cards = 2, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn("flex-shrink-0 w-72", className)}>
      <Skeleton className="h-8 w-full rounded mb-2" />
      <div className="space-y-2">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded" />
        ))}
      </div>
    </div>
  );
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
  SkeletonLeadsTableView,
  SkeletonLeadsKanbanView,
  SkeletonNewsSection,
  SkeletonIntegrationsSection,
  SkeletonBadge,
  SkeletonChart,
  SkeletonForm,
  SkeletonMetricCard,
  SkeletonButton,
  SkeletonInput,
  SkeletonToggle,
  SkeletonIconButton,
  SkeletonConversationList,
  SkeletonMessageThread,
  SkeletonUserCard,
  SkeletonSearchResults,
  SkeletonKanbanColumn,
  // TopBar skeletons
  SkeletonTopBar,
  SkeletonTopBarPageContext,
  SkeletonTopBarTabs,
  SkeletonTopBarSearch,
  SkeletonTopBarActions,
};

// =============================================================================
// TOPBAR SKELETON COMPONENTS
// =============================================================================

interface SkeletonTopBarPageContextProps {
  showSubtitle?: boolean;
  className?: string;
}

/**
 * Skeleton for the left section of TopBar (icon + title + optional subtitle)
 */
function SkeletonTopBarPageContext({ 
  showSubtitle = false,
  className 
}: SkeletonTopBarPageContextProps) {
  return (
    <div className={cn("flex items-center gap-2 min-w-0 shrink-0", className)}>
      {/* Icon placeholder - 24x24 rounded square */}
      <Skeleton className="w-6 h-6 rounded" />
      {/* Title + optional subtitle */}
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-4 w-20" />
        {showSubtitle && <Skeleton className="h-3 w-24 hidden sm:block" />}
      </div>
    </div>
  );
}

interface SkeletonTopBarTabsProps {
  tabCount?: number;
  className?: string;
}

/**
 * Skeleton for center section tabs in TopBar
 */
function SkeletonTopBarTabs({ 
  tabCount = 3,
  className 
}: SkeletonTopBarTabsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: tabCount }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-8 rounded-md",
            i === 0 ? "w-20 bg-accent" : "w-16"
          )} 
        />
      ))}
    </div>
  );
}

interface SkeletonTopBarSearchProps {
  className?: string;
}

/**
 * Skeleton for the search input in TopBar
 */
function SkeletonTopBarSearch({ className }: SkeletonTopBarSearchProps) {
  return (
    <Skeleton className={cn("h-8 w-48 lg:w-64 rounded-md", className)} />
  );
}

interface SkeletonTopBarActionsProps {
  buttonCount?: number;
  className?: string;
}

/**
 * Skeleton for right section action buttons in TopBar
 */
function SkeletonTopBarActions({ 
  buttonCount = 2,
  className 
}: SkeletonTopBarActionsProps) {
  return (
    <div className={cn("flex items-center gap-2 shrink-0", className)}>
      {Array.from({ length: buttonCount }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-8 rounded-md" />
      ))}
    </div>
  );
}

interface SkeletonTopBarProps {
  className?: string;
  showTabs?: boolean;
  tabCount?: number;
  showSearch?: boolean;
  buttonCount?: number;
}

/**
 * Complete TopBar skeleton matching the 48px height and three-section layout
 */
function SkeletonTopBar({ 
  className,
  showTabs = false,
  tabCount = 3,
  showSearch = false,
  buttonCount = 2,
}: SkeletonTopBarProps) {
  return (
    <div className={cn(
      "h-12 border-b border-border bg-background flex items-center px-4 gap-4 shrink-0",
      className
    )}>
      {/* Left section */}
      <SkeletonTopBarPageContext />
      
      {/* Center section */}
      <div className="flex-1 flex items-center justify-center min-w-0 overflow-hidden">
        {showTabs && <SkeletonTopBarTabs tabCount={tabCount} />}
        {showSearch && <SkeletonTopBarSearch />}
      </div>
      
      {/* Right section */}
      <SkeletonTopBarActions buttonCount={buttonCount} />
    </div>
  );
}
