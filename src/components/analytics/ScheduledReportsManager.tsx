/**
 * ScheduledReportsManager Component
 * 
 * Management interface for scheduled analytics reports.
 * Lists, enables/disables, and configures automated report delivery.
 * @module components/analytics/ScheduledReportsManager
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash01, Clock } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { CreateScheduledReportDialog } from './CreateScheduledReportDialog';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const ScheduledReportsManager = () => {
  const { reports, loading, toggleReportStatus, deleteReport } = useScheduledReports();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [savedReportIds, setSavedReportIds] = useState<Set<string>>(new Set());

  const getFrequencyDisplay = (report: typeof reports[number]) => {
    const time = report.time_of_day?.substring(0, 5) || '09:00';
    
    switch (report.frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly': {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[report.day_of_week ?? 0]} at ${time}`;
      }
      case 'monthly':
        return `Monthly on day ${report.day_of_month} at ${time}`;
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Automatically send analytics reports to your team
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              Schedule Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading scheduled reports...
            </div>
          ) : reports.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-5 w-5 text-muted-foreground/50" />}
              title="No scheduled reports yet"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Last Sent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getFrequencyDisplay(report)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {Array.isArray(report.recipients) ? report.recipients.length : 0} recipient(s)
                      </span>
                    </TableCell>
                    <TableCell>
                      {report.last_sent_at ? (
                        <span className="text-sm">
                          {format(new Date(report.last_sent_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Never sent</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={report.active}
                          onCheckedChange={(checked) => handleToggle(report.id, checked)}
                        />
                        <SavedIndicator show={savedReportIds.has(report.id)} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(report.id)}
                        aria-label="Delete scheduled report"
                      >
                        <Trash01 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateScheduledReportDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

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
