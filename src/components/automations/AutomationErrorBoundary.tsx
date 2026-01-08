/**
 * AutomationErrorBoundary Component
 * 
 * Catches errors in the automation flow editor and provides recovery UI.
 * 
 * @module components/automations/AutomationErrorBoundary
 */

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AutomationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Automation Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-destructive/5 p-6">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-destructive" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              An error occurred in the automation editor. Try refreshing or contact support if the problem persists.
            </p>
            <Button onClick={this.handleReset} variant="outline">
              <RefreshCcw01 size={16} className="mr-2" aria-hidden="true" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
