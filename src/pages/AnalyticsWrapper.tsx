/**
 * AnalyticsWrapper
 * 
 * Lazy-loading wrapper for the Analytics page.
 * Reduces initial bundle size by code-splitting this component.
 * 
 * @module pages/AnalyticsWrapper
 */

import { lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonAnalyticsPage } from '@/components/ui/page-skeleton';

const Analytics = lazy(() => import('./Analytics'));

const AnalyticsWrapper = () => {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonAnalyticsPage className="min-h-[400px]" />}>
        <Analytics />
      </Suspense>
    </PageTransition>
  );
};

export default AnalyticsWrapper;
