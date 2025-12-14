/**
 * AriConfiguratorWrapper
 * 
 * Lazy-loading wrapper for the AriConfigurator page.
 * @module pages/AriConfiguratorWrapper
 */

import { lazy, Suspense } from 'react';
import { MultiStepLoader } from '@/components/ui/multi-step-loader';

const AriConfigurator = lazy(() => import('./AriConfigurator'));

const loadingStates = [
  { text: "Loading Ari..." },
];

const AriConfiguratorWrapper = () => (
  <Suspense fallback={
    <MultiStepLoader 
      loadingStates={loadingStates} 
      loading={true} 
      duration={500} 
      loop={true} 
    />
  }>
    <AriConfigurator />
  </Suspense>
);

export default AriConfiguratorWrapper;
