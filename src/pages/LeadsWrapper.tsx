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
import { SkeletonLeadsPage } from '@/components/ui/skeleton';

const Leads = lazy(() => import('./Leads'));

const LeadsWrapper = () => {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonLeadsPage className="px-4 lg:px-8 pt-4" />}>
        <Leads />
      </Suspense>
    </PageTransition>
  );
};

export default LeadsWrapper;
