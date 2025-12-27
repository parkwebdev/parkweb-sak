/**
 * RecentBookingsTable Component
 * 
 * Table displaying recent bookings with quick actions to update status.
 * Shows event details, visitor info, location, and status badges.
 * 
 * @module components/analytics/RecentBookingsTable
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Check, XClose } from '@untitledui/icons';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { BookingStatus } from '@/types/analytics';

/** Raw calendar event with expanded fields */
export interface RecentBookingEvent {
  id: string;
  title: string;
  start_time: string;
  status: BookingStatus | null;
  visitor_name: string | null;
  visitor_email: string | null;
  locations: {
    id: string;
    name: string;
  } | null;
}

interface RecentBookingsTableProps {
  /** Array of recent booking events */
  events: RecentBookingEvent[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Callback when status is updated */
  onUpdateStatus?: (eventId: string, newStatus: BookingStatus) => Promise<void>;
  /** Optional CSS class name */
  className?: string;
}

/** Status badge color mapping */
const STATUS_COLORS: Record<BookingStatus, { bg: string; text: string }> = {
  confirmed: { bg: 'bg-primary/10', text: 'text-primary' },
  completed: { bg: 'bg-success/10', text: 'text-success' },
  cancelled: { bg: 'bg-destructive/10', text: 'text-destructive' },
  no_show: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

/** Status display labels */
const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

/**
 * Renders a table of recent bookings with quick actions.
 * Includes loading skeleton and empty state.
 */
export const RecentBookingsTable = React.memo(function RecentBookingsTable({
  events,
  loading = false,
  onUpdateStatus,
  className,
}: RecentBookingsTableProps) {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const handleStatusUpdate = async (eventId: string, newStatus: BookingStatus) => {
    if (!onUpdateStatus) return;
    
    setUpdatingId(eventId);
    try {
      await onUpdateStatus(eventId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" role="status" aria-label="Loading recent bookings">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <Card className={cn('h-full', className)}>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Calendar size={20} className="text-muted-foreground" />}
            title="No recent bookings"
            description="Bookings will appear here once appointments are scheduled."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to="/ari?tab=locations">
                  <Calendar size={16} className="mr-2" />
                  Connect Calendar
                </Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
        <p className="text-sm text-muted-foreground">
          Showing {events.length} most recent appointments
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Date & Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Visitor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const status = event.status || 'confirmed';
                const statusColors = STATUS_COLORS[status];
                const isUpdating = updatingId === event.id;
                const canUpdateStatus = status === 'confirmed' && onUpdateStatus;

                return (
                  <TableRow key={event.id}>
                    <TableCell className="text-sm">
                      {format(parseISO(event.start_time), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {event.title || 'Untitled Event'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.visitor_name || event.visitor_email || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.locations?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs', statusColors.bg, statusColors.text)}
                      >
                        {STATUS_LABELS[status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdateStatus && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(event.id, 'completed')}
                            disabled={isUpdating}
                            className="h-7 px-2 text-xs text-success hover:text-success hover:bg-success/10"
                          >
                            <Check size={14} className="mr-1" />
                            Done
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(event.id, 'no_show')}
                            disabled={isUpdating}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <XClose size={14} className="mr-1" />
                            No-show
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
});
