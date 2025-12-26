/**
 * GetStartedWrapper
 * 
 * Lazy-loading wrapper for the Get Started onboarding page.
 * Reduces initial bundle size by code-splitting this component.
 * 
 * @module pages/GetStartedWrapper
 */

import { lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonGetStartedPage } from '@/components/ui/page-skeleton';

const GetStarted = lazy(() => import('./GetStarted').then(module => ({ default: module.GetStarted })));

function GetStartedWrapper() {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonGetStartedPage className="min-h-[400px]" />}>
        <GetStarted />
      </Suspense>
    </PageTransition>
  );
};

export default GetStartedWrapper;
