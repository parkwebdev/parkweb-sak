/**
 * LeadsWrapper
 * 
 * Lazy-loading wrapper for the Leads page.
 * Reduces initial bundle size by code-splitting this component.
 * 
 * @module pages/LeadsWrapper
 */

import { lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { LoadingState } from '@/components/ui/loading-state';

const Leads = lazy(() => import('./Leads'));

const LeadsWrapper = () => {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingState text="Loading leads..." className="min-h-[400px]" />}>
        <Leads />
      </Suspense>
    </PageTransition>
  );
};

export default LeadsWrapper;
