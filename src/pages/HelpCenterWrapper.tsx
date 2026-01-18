/**
 * Help Center Page Wrapper
 * 
 * Lazy loading wrapper for the Help Center page.
 * Provides Suspense boundary with skeleton loading.
 * 
 * @module pages/HelpCenterWrapper
 */

import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const HelpCenter = lazy(() => import('./HelpCenter'));

/** Skeleton loading state for Help Center */
function HelpCenterSkeleton() {
  return (
    <div className="flex h-full">
      {/* Left sidebar skeleton */}
      <div className="w-[260px] border-r border-border p-4 space-y-4">
        <Skeleton className="h-9 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 p-8 space-y-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-72" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      
      {/* Right ToC skeleton */}
      <div className="w-[200px] p-4 space-y-3 hidden lg:block">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/** Help Center page wrapper with Suspense */
export default function HelpCenterWrapper() {
  return (
    <Suspense fallback={<HelpCenterSkeleton />}>
      <HelpCenter />
    </Suspense>
  );
}
