/**
 * AutomationsListSkeleton Component
 * 
 * Loading skeleton for the automations list.
 * 
 * @module components/automations/AutomationsListSkeleton
 */

import { Skeleton } from '@/components/ui/skeleton';

export function AutomationsListSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>

      {/* List skeleton */}
      <div className="p-2 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg">
            <div className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-md flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
