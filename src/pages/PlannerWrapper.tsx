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
import { LoadingState } from '@/components/ui/loading-state';

const Planner = lazy(() => import('./Planner'));

const PlannerWrapper = () => {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingState text="Loading calendar..." className="min-h-[400px]" />}>
        <Planner />
      </Suspense>
    </PageTransition>
  );
};

export default PlannerWrapper;
