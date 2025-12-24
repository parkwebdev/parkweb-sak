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
import { LoadingState } from '@/components/ui/loading-state';

const GetStarted = lazy(() => import('./GetStarted').then(module => ({ default: module.GetStarted })));

const GetStartedWrapper: React.FC = () => {
  return (
    <PageTransition>
      <Suspense fallback={<LoadingState text="Loading..." className="min-h-[400px]" />}>
        <GetStarted />
      </Suspense>
    </PageTransition>
  );
};

export default GetStartedWrapper;
