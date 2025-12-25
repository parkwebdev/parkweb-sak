/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a fallback UI instead of crashing.
 * 
 * @module components/ErrorBoundary
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';

/**
 * Props for the ErrorBoundary component
 */
interface Props {
  /** Child components to render */
  children: ReactNode;
  /** Optional custom fallback UI to display on error - can be a ReactNode or render function */
  fallback?: ReactNode | ((error: Error | null) => ReactNode);
}

/**
 * Internal state for error tracking
 * @internal
 */
interface State {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error object */
  error: Error | null;
}

/**
 * React Error Boundary for catching and handling component errors.
 * Provides a graceful fallback UI and logging when errors occur.
 * 
 * @example
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * @example
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error is caught
   * @internal
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Log error details for debugging
   * @internal
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', { error, errorInfo });
  }

  /**
   * Reset error state to retry rendering
   * @internal
   */
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Support both ReactNode and render function fallbacks
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error);
        }
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
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
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left p-4 bg-muted rounded-lg">
                <summary className="text-sm font-medium cursor-pointer text-muted-foreground">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-2 text-xs text-destructive overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;