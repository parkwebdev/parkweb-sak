/**
 * ScheduledReportsManager Component
 * 
 * Management interface for scheduled analytics reports.
 * Lists, enables/disables, and configures automated report delivery.
 * @module components/analytics/ScheduledReportsManager
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash01, Clock } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { SavedIndicator } from '@/components/settings/SavedIndicator';

interface ScheduledReportsManagerProps {
  /** Optional external loading state override */
  loading?: boolean;
}

export const ScheduledReportsManager = ({ loading: externalLoading }: ScheduledReportsManagerProps) => {
  const { reports, loading: internalLoading, toggleReportStatus, deleteReport } = useScheduledReports();
  const loading = externalLoading ?? internalLoading;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savedReportIds, setSavedReportIds] = useState<Set<string>>(new Set());

  const getFrequencyDisplay = (report: typeof reports[number]) => {
    const timeStr = report.time_of_day?.substring(0, 5) || '09:00';
    
    // Convert 24h to 12h format (hour only since cron runs hourly)
    const hours = parseInt(timeStr.split(':')[0]);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const formattedTime = `${displayHours}:00 ${period}`;
    
    switch (report.frequency) {
      case 'daily':
        return `Daily at ${formattedTime}`;
      case 'weekly': {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[report.day_of_week ?? 0]} at ${formattedTime}`;
      }
      case 'monthly':
        return `Monthly on day ${report.day_of_month} at ${formattedTime}`;
      default:
        return report.frequency;
    }
  };

  const handleToggle = async (id: string, checked: boolean) => {
    await toggleReportStatus(id, checked);
    setSavedReportIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setSavedReportIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 2000);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteReport(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <Card className="h-full">
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Skeleton className="h-5 w-9 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-5 w-5 text-muted-foreground/50" />}
              title="No scheduled reports yet"
              description="Use the Build Report button to schedule automated report delivery"
            />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{report.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getFrequencyDisplay(report)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={report.active}
                        onCheckedChange={(checked) => handleToggle(report.id, checked)}
                      />
                      <SavedIndicator show={savedReportIds.has(report.id)} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(report.id)}
                      aria-label="Delete scheduled report"
                    >
                      <Trash01 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SimpleDeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Scheduled Report"
        description="Are you sure you want to delete this scheduled report? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  );
};
