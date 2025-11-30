import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Edit02, Trash01, Clock } from '@untitledui/icons';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { CreateScheduledReportDialog } from './CreateScheduledReportDialog';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export const ScheduledReportsManager = () => {
  const { reports, loading, toggleReportStatus, deleteReport } = useScheduledReports();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getFrequencyDisplay = (report: any) => {
    const time = report.time_of_day?.substring(0, 5) || '09:00';
    
    switch (report.frequency) {
      case 'daily':
        return `Daily at ${time}`;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[report.day_of_week]} at ${time}`;
      case 'monthly':
        return `Monthly on day ${report.day_of_month} at ${time}`;
      default:
        return report.frequency;
    }
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
            <Button onClick={() => setIsCreateOpen(true)}>
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
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No scheduled reports yet</p>
              <p className="text-sm">Create your first scheduled report to automate analytics delivery</p>
            </div>
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
                    <Switch
                      checked={report.active}
                      onCheckedChange={(checked) => toggleReportStatus(report.id, checked)}
                    />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            // TODO: Implement edit functionality
                          }}
                        >
                          <Edit02 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(report.id)}
                        >
                          <Trash01 className="h-4 w-4" />
                        </Button>
                      </div>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheduled report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
