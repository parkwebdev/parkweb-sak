import { AlertCircle } from '@untitledui/icons';
import { Button } from '@/components/ui/button';

interface RouteErrorFallbackProps {
  error?: Error;
}

const RouteErrorFallback = ({ error }: RouteErrorFallbackProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </Button>
          <Button
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
        {import.meta.env.DEV && error && (
          <details className="mt-6 text-left p-4 bg-muted rounded-lg">
            <summary className="text-sm font-medium cursor-pointer text-muted-foreground">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs text-destructive overflow-auto max-h-40">
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default RouteErrorFallback;
