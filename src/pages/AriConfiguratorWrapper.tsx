/**
 * AriConfiguratorWrapper
 * 
 * Lazy-loading wrapper for the AriConfigurator page.
 * @module pages/AriConfiguratorWrapper
 */

import { lazy, Suspense } from 'react';
import { SkeletonAriConfiguratorPage } from '@/components/ui/page-skeleton';

const AriConfigurator = lazy(() => import('./AriConfigurator'));

const AriConfiguratorWrapper = () => (
  <Suspense fallback={<SkeletonAriConfiguratorPage />}>
    <AriConfigurator />
  </Suspense>
);

export default AriConfiguratorWrapper;
