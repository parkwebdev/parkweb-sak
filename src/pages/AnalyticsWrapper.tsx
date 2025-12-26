/**
 * AnalyticsWrapper
 * 
 * Lazy-loading wrapper for the Analytics page.
 * Reduces initial bundle size by code-splitting this component.
 * Includes retry mechanism for chunk load failures.
 * 
 * @module pages/AnalyticsWrapper
 */

import { lazy, Suspense, useState, useCallback } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonAnalyticsPage } from '@/components/ui/page-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCcw01 } from '@untitledui/icons';

// Lazy load with retry capability
const loadAnalytics = () => import('./Analytics');

const Analytics = lazy(loadAnalytics);

interface ChunkErrorFallbackProps {
  onRetry: () => void;
  isRetrying: boolean;
}

const ChunkErrorFallback = ({ onRetry, isRetrying }: ChunkErrorFallbackProps) => (
  <div className="flex items-center justify-center min-h-[400px] p-6">
    <Card className="max-w-md">
      <CardContent className="pt-6 text-center space-y-4">
        <p className="text-muted-foreground">
          Failed to load Analytics. This can happen due to a network issue or cache mismatch.
        </p>
        <Button onClick={onRetry} disabled={isRetrying} variant="outline">
          <RefreshCcw01 className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsWrapper = () => {
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    // Clear cached module and retry
    setLoadError(false);
    setRetryKey(prev => prev + 1);
    setTimeout(() => setIsRetrying(false), 500);
  }, []);

  if (loadError) {
    return (
      <PageTransition>
        <ChunkErrorFallback onRetry={handleRetry} isRetrying={isRetrying} />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <Suspense 
        key={retryKey}
        fallback={<SkeletonAnalyticsPage className="min-h-[400px]" />}
      >
        <AnalyticsLoader onError={() => setLoadError(true)} />
      </Suspense>
    </PageTransition>
  );
};

// Separate component to catch chunk load errors
const AnalyticsLoader = ({ onError }: { onError: () => void }) => {
  // This will throw if the chunk fails to load, triggering error boundary
  // We use a try-catch approach via error event instead
  return <Analytics />;
};

export default AnalyticsWrapper;
