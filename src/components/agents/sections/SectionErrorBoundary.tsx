/**
 * SectionErrorBoundary Component
 * 
 * Lightweight error boundary for individual Ari configuration sections.
 * Prevents a single section crash from taking down the entire configurator.
 * 
 * @module components/agents/sections/SectionErrorBoundary
 */

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { logger } from '@/utils/logger';

interface SectionErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Section name for error display */
  sectionName?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches errors in section components
 * and displays a recovery UI instead of crashing the page.
 */
export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development
    logger.error('[SectionErrorBoundary] Caught error:', { error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle size={24} className="text-destructive" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-medium text-foreground">
                {this.props.sectionName 
                  ? `Error loading ${this.props.sectionName}` 
                  : 'Error loading section'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Something went wrong while loading this section. 
                Try refreshing or contact support if the issue persists.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={this.handleRetry}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
