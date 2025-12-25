/**
 * PlannerWrapper
 * 
 * Lazy-loading wrapper for the Planner (Calendar) page.
 * Reduces initial bundle size by code-splitting this component.
 * 
 * @module pages/PlannerWrapper
 */

import { lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonCalendarPage } from '@/components/ui/page-skeleton';

const Planner = lazy(() => import('./Planner'));

const PlannerWrapper = () => {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonCalendarPage className="min-h-[400px]" />}>
        <Planner />
      </Suspense>
    </PageTransition>
  );
};

export default PlannerWrapper;
