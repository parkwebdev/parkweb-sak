import { AlertCircle } from '@untitledui/icons';

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
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Go Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
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
