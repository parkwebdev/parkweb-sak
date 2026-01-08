/**
 * AutomationsWrapper
 * 
 * Lazy-loading wrapper for the Automations page.
 * Reduces initial bundle size by code-splitting this component.
 * 
 * @module pages/AutomationsWrapper
 */

import { lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonTablePage } from '@/components/ui/page-skeleton';

const Automations = lazy(() => import('./Automations'));

function AutomationsWrapper() {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonTablePage className="min-h-[400px]" />}>
        <Automations />
      </Suspense>
    </PageTransition>
  );
}

export default AutomationsWrapper;
