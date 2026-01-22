/**
 * Planner Page (Calendar)
 * 
 * Full-featured calendar for scheduling property showings, move-ins,
 * inspections, and maintenance. Supports month/week/day views,
 * drag-and-drop, event resizing, recurrence, and conflict detection.
 * 
 * @page
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getNavigationIcon } from '@/lib/navigation-icons';
import { FullCalendar } from '@/components/calendar/FullCalendar';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { EventDetailDialog } from '@/components/calendar/EventDetailDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { TimeChangeReasonDialog } from '@/components/calendar/TimeChangeReasonDialog';
import { SkeletonCalendarPage } from '@/components/ui/page-skeleton';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCanManageMultiple } from '@/hooks/useCanManage';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { PlannerSearchWrapper } from '@/components/calendar/PlannerSearchWrapper';
import { EventTypeDropdown } from '@/components/calendar/EventTypeDropdown';
import type { CalendarEvent, TimeChangeRecord } from '@/types/calendar';
import { logger } from '@/utils/logger';

interface PendingTimeChange {
  event: CalendarEvent;
  originalStart: Date;
  originalEnd: Date;
  newStart: Date;
  newEnd: Date;
}

function Planner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  
  // Permission checks
  const { manage_bookings: canManageBookings, manage_integrations: canManageIntegrations } = useCanManageMultiple(['manage_bookings', 'manage_integrations'] as const);
  
  // Fetch real calendar events from database
  const { 
    events: dbEvents, 
    isLoading, 
    cancelEvent, 
    completeEvent, 
    rescheduleEvent,
    refetch,
    accountOwnerId,
  } = useCalendarEvents();
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Time change reason dialog state
  const [timeChangeDialogOpen, setTimeChangeDialogOpen] = useState(false);
  const [pendingTimeChange, setPendingTimeChange] = useState<PendingTimeChange | null>(null);

  // Handle event ID from URL query param (from Global Search)
  useEffect(() => {
    const eventIdFromUrl = searchParams.get('id');
    if (eventIdFromUrl && dbEvents.length > 0 && !isLoading) {
      const event = dbEvents.find(e => e.id === eventIdFromUrl);
      if (event) {
        setSelectedEvent(event);
        setEventDetailOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, dbEvents, isLoading, setSearchParams]);

  // Filter events based on active tab
  const filteredEvents = dbEvents.filter(event => {
    return activeTab === 'all' || event.type === activeTab;
  });

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDetailOpen(true);
  }, []);
  
  // Configure top bar for this page
  // Note: PlannerSearchWrapper fetches its own data, keeping topBarConfig stable
  const topBarConfig = useMemo(() => ({
    left: (
      <div className="flex items-center gap-3">
        <TopBarPageContext icon={getNavigationIcon('Calendar')} title="Planner" />
        <PlannerSearchWrapper onSelect={handleEventClick} />
      </div>
    ),
    center: undefined,
    right: (
      <div className="flex items-center gap-2">
        <EventTypeDropdown activeType={activeTab} onTypeChange={setActiveTab} />
        {canManageBookings && (
          <Button size="sm" onClick={() => {
            setSelectedDate(new Date());
            setCreateDialogOpen(true);
          }}>
            Add event
          </Button>
        )}
      </div>
    ),
  }), [activeTab, canManageBookings, handleEventClick]);
  useTopBar(topBarConfig, 'planner');

  const handleAddEvent = () => {
    setSelectedDate(new Date());
    setCreateDialogOpen(true);
  };

  const handleCreateEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    // TODO: Connect to database create when calendar accounts are connected
    logger.info('Create event', newEvent);
    setCreateDialogOpen(false);
    refetch();
  };

  // Apply time change with optional reason
  const applyTimeChange = useCallback(async (reason?: string) => {
    if (!pendingTimeChange) return;
    
    const { event, newStart, newEnd } = pendingTimeChange;
    
    await rescheduleEvent(event.id, newStart, newEnd, reason);
    
    setPendingTimeChange(null);
    setTimeChangeDialogOpen(false);
  }, [pendingTimeChange, rescheduleEvent]);

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    // Check if time changed from original
    if (selectedEvent) {
      const originalStart = new Date(selectedEvent.start);
      const originalEnd = new Date(selectedEvent.end);
      const newStart = new Date(updatedEvent.start);
      const newEnd = new Date(updatedEvent.end);
      
      const timeChanged = originalStart.getTime() !== newStart.getTime() || 
                         originalEnd.getTime() !== newEnd.getTime();
      
      if (timeChanged) {
        setPendingTimeChange({
          event: updatedEvent,
          originalStart,
          originalEnd,
          newStart,
          newEnd,
        });
        setTimeChangeDialogOpen(true);
        setEventDetailOpen(false);
        return;
      }
    }
    
    // No time change, just close
    setEventDetailOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent) {
      await cancelEvent(selectedEvent.id, 'Deleted by user');
      setDeleteDialogOpen(false);
      setEventDetailOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleMarkComplete = async () => {
    if (selectedEvent) {
      await completeEvent(selectedEvent.id);
      setEventDetailOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleDeleteFromDetail = () => {
    setEventDetailOpen(false);
    setDeleteDialogOpen(true);
  };

  // Handle drag-based time changes (move)
  const handleEventMove = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    const event = dbEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const originalStart = new Date(event.start);
    const originalEnd = new Date(event.end);
    
    // Check if time actually changed
    if (originalStart.getTime() === newStart.getTime() && originalEnd.getTime() === newEnd.getTime()) {
      return;
    }
    
    setPendingTimeChange({
      event,
      originalStart,
      originalEnd,
      newStart,
      newEnd,
    });
    setTimeChangeDialogOpen(true);
  }, [dbEvents]);

  // Handle resize-based time changes
  const handleEventResize = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    const event = dbEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const originalStart = new Date(event.start);
    const originalEnd = new Date(event.end);
    
    // Check if time actually changed
    if (originalEnd.getTime() === newEnd.getTime()) {
      return;
    }
    
    setPendingTimeChange({
      event,
      originalStart,
      originalEnd,
      newStart,
      newEnd,
    });
    setTimeChangeDialogOpen(true);
  }, [dbEvents]);

  if (isLoading) {
    return <SkeletonCalendarPage />;
  }

  // Error state when data couldn't be loaded (e.g., during impersonation timing)
  if (!accountOwnerId && dbEvents.length === 0) {
    return (
      <main className="flex-1 bg-muted/30 h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <p className="text-destructive text-lg font-medium">Unable to load calendar</p>
          <p className="text-muted-foreground text-sm">
            There was an issue loading your calendar data. This may be a temporary issue.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-muted/30 h-full overflow-auto">
      <div className="px-4 py-6">
        {/* Calendar */}
        <FullCalendar
          events={filteredEvents}
          onDateClick={canManageBookings ? handleDateClick : undefined}
          onEventClick={handleEventClick}
          onAddEvent={canManageBookings ? handleAddEvent : undefined}
          onEventMove={canManageBookings ? handleEventMove : undefined}
          onEventResize={canManageBookings ? handleEventResize : undefined}
        />
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialDate={selectedDate || undefined}
        onCreateEvent={handleCreateEvent}
        existingEvents={dbEvents}
      />

      <EventDetailDialog
        open={eventDetailOpen}
        onOpenChange={setEventDetailOpen}
        event={selectedEvent}
        onUpdateEvent={handleUpdateEvent}
        onDelete={canManageBookings ? handleDeleteFromDetail : undefined}
        onMarkComplete={canManageBookings ? handleMarkComplete : undefined}
        existingEvents={dbEvents}
        canManage={canManageBookings}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Booking"
        description={`Are you sure you want to delete "${selectedEvent?.title}"? This action cannot be undone.`}
        onConfirm={handleDeleteEvent}
      />

      <TimeChangeReasonDialog
        open={timeChangeDialogOpen}
        onOpenChange={setTimeChangeDialogOpen}
        event={pendingTimeChange?.event || null}
        originalStart={pendingTimeChange?.originalStart || null}
        originalEnd={pendingTimeChange?.originalEnd || null}
        newStart={pendingTimeChange?.newStart || null}
        newEnd={pendingTimeChange?.newEnd || null}
        onConfirm={applyTimeChange}
        onSkip={() => applyTimeChange()}
        existingEvents={dbEvents}
      />
    </main>
  );
};

export default Planner;
