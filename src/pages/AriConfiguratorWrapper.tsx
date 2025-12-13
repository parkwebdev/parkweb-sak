/**
 * AriConfiguratorWrapper
 * 
 * Lazy-loading wrapper for the AriConfigurator page.
 * @module pages/AriConfiguratorWrapper
 */

import { lazy, Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';

const AriConfigurator = lazy(() => import('./AriConfigurator'));

const AriConfiguratorWrapper = () => (
  <Suspense fallback={<LoadingState text="Loading Ari..." />}>
    <AriConfigurator />
  </Suspense>
);

export default AriConfiguratorWrapper;
