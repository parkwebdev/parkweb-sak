/**
 * DashboardWrapper
 * 
 * Lazy-loading wrapper for the Dashboard page.
 * Reduces initial bundle size by code-splitting this component.
 * 
 * @module pages/DashboardWrapper
 */

import { lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonDashboardPage } from '@/components/ui/page-skeleton';

const Dashboard = lazy(() => import('./Dashboard').then(module => ({ default: module.Dashboard })));

const DashboardWrapper = () => {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonDashboardPage className="min-h-[400px]" />}>
        <Dashboard />
      </Suspense>
    </PageTransition>
  );
};

export default DashboardWrapper;
