/**
 * AnalyticsWrapper
 * 
 * Lazy-loading wrapper for the Analytics page.
 * Uses ErrorBoundary to catch chunk load failures.
 * 
 * @module pages/AnalyticsWrapper
 */

import { lazy, Suspense, useState, useCallback } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonAnalyticsPage } from '@/components/ui/page-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCcw01 } from '@untitledui/icons';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy load Analytics
const Analytics = lazy(() => import('./Analytics'));

interface ChunkErrorFallbackProps {
  error: Error | null;
  onRetry: () => void;
}

const ChunkErrorFallback = ({ error, onRetry }: ChunkErrorFallbackProps) => (
  <div className="flex items-center justify-center min-h-[400px] p-6">
    <Card className="max-w-md">
      <CardContent className="pt-6 text-center space-y-4">
        <p className="text-muted-foreground">
          Failed to load Analytics. This can happen due to a network issue or cache mismatch.
        </p>
        {import.meta.env.DEV && error && (
          <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {error.message}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={onRetry} variant="outline">
            <RefreshCcw01 size={16} />
            Retry
          </Button>
          <Button onClick={() => window.location.reload()} variant="secondary">
            Hard Reload
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsWrapper = () => {
  const [boundaryKey, setBoundaryKey] = useState(0);

  const handleRetry = useCallback(() => {
    setBoundaryKey(prev => prev + 1);
  }, []);

  return (
    <PageTransition>
      <ErrorBoundary
        key={boundaryKey}
        fallback={(error) => (
          <ChunkErrorFallback error={error} onRetry={handleRetry} />
        )}
      >
        <Suspense fallback={<SkeletonAnalyticsPage className="min-h-[400px]" />}>
          <Analytics />
        </Suspense>
      </ErrorBoundary>
    </PageTransition>
  );
};

export default AnalyticsWrapper;
