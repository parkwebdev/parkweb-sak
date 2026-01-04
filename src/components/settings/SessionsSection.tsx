/**
 * SessionsSection Component
 * 
 * Displays a table of all active user sessions with the ability to
 * sign out of other devices. Matches the design patterns of other
 * settings pages.
 * 
 * @module components/settings/SessionsSection
 */

import { useState, useMemo } from 'react';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/data-table';
import { LogOut01 } from '@untitledui/icons';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { Skeleton } from '@/components/ui/skeleton';
import { useSessions } from '@/hooks/useSessions';
import { createSessionColumns } from '@/components/data-table/columns/sessions-columns';
import { toast } from '@/lib/toast';

export function SessionsSection() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  
  const { 
    sessions, 
    isLoading, 
    revokeOthers, 
    isRevokingOthers 
  } = useSessions();

  // Individual session revocation - show toast since not fully implemented
  const handleRevokeSession = (sessionId: string) => {
    setRevokingSessionId(sessionId);
    toast.info('Individual session revocation', {
      description: 'Use "Sign out other sessions" to terminate all other sessions at once.',
    });
    setTimeout(() => setRevokingSessionId(null), 1000);
  };

  const columns = useMemo(
    () => createSessionColumns({
      onRevoke: handleRevokeSession,
      isRevoking: revokingSessionId,
    }),
    [revokingSessionId]
  );

  const table = useReactTable({
    data: sessions,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const hasOtherSessions = sessions.filter(s => !s.is_current).length > 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-9 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AnimatedList className="space-y-4" staggerDelay={0.1}>
      <AnimatedItem>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
                Active Sessions
              </CardTitle>
              <CardDescription className="text-sm">
                Manage your active login sessions across devices
              </CardDescription>
            </div>
            {hasOtherSessions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDialog(true)}
                disabled={isRevokingOthers}
              >
                <LogOut01 size={16} aria-hidden="true" />
                Sign out other sessions
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <DataTable
              table={table}
              columns={columns}
              emptyMessage="No active sessions found"
            />
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all other browsers and devices where you're currently logged in. 
              Your current session will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevokingOthers}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                revokeOthers();
                setShowConfirmDialog(false);
              }}
              disabled={isRevokingOthers}
            >
              {isRevokingOthers ? 'Signing out...' : 'Sign out other sessions'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedList>
  );
}
