/**
 * SettingsWrapper
 * 
 * Lazy-loading wrapper for the Settings page.
 * Reduces initial bundle size by code-splitting this component.
 * 
 * @module pages/SettingsWrapper
 */

import { lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonSettingsPage } from '@/components/ui/page-skeleton';

const Settings = lazy(() => import('./Settings'));

const SettingsWrapper = () => {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonSettingsPage className="min-h-[400px]" />}>
        <Settings />
      </Suspense>
    </PageTransition>
  );
};

export default SettingsWrapper;
