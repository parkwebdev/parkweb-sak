import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from '@untitledui/icons';
import { Spinner } from '@/components/ui/spinner';

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  responseTime?: number;
  body?: any;
  error?: string;
}

interface TestToolResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName: string;
  loading: boolean;
  result: TestResult | null;
}

export const TestToolResultDialog = ({
  open,
  onOpenChange,
  toolName,
  loading,
  result,
}: TestToolResultDialogProps) => {
  const isSuccess = result?.success && result?.status && result.status >= 200 && result.status < 300;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono text-base">Test Results: {toolName}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner className="h-8 w-8 mb-3" />
              <p className="text-sm text-muted-foreground">Testing endpoint...</p>
            </div>
          ) : result ? (
            <>
              {/* Status */}
              <div className="flex items-center gap-2">
                {isSuccess ? (
                  <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium">
                  {result.success 
                    ? `${result.status} ${result.statusText || 'OK'}`
                    : 'Error'
                  }
                </span>
              </div>

              {/* Response Time */}
              {result.responseTime !== undefined && (
                <div className="text-sm text-muted-foreground">
                  Response Time: <span className="font-mono">{result.responseTime}ms</span>
                </div>
              )}

              {/* Error Message */}
              {result.error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{result.error}</p>
                </div>
              )}

              {/* Response Body */}
              {result.body !== undefined && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Response:</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg border overflow-auto max-h-64 font-mono">
                    {typeof result.body === 'string' 
                      ? result.body 
                      : JSON.stringify(result.body, null, 2)
                    }
                  </pre>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No test results yet.
            </p>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};