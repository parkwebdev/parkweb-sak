/**
 * Planner Page (Calendar)
 * 
 * Full-featured calendar for scheduling property showings, move-ins,
 * inspections, and maintenance. Supports month/week/day views,
 * drag-and-drop, event resizing, recurrence, and conflict detection.
 * 
 * @page
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { AnimatedTabsList } from '@/components/ui/animated-tabs-list';
import { Calendar as CalendarIcon } from '@untitledui/icons';
import { FullCalendar } from '@/components/calendar/FullCalendar';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { EventDetailDialog } from '@/components/calendar/EventDetailDialog';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { TimeChangeReasonDialog } from '@/components/calendar/TimeChangeReasonDialog';
import { SkeletonCalendarPage } from '@/components/ui/page-skeleton';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCanManageMultiple } from '@/hooks/useCanManage';
import { useTopBar, TopBarPageContext, TopBarTabs, type TopBarTab } from '@/components/layout/TopBar';
import type { CalendarEvent, TimeChangeRecord } from '@/types/calendar';
import { EVENT_TYPE_CONFIG } from '@/types/calendar';
import { logger } from '@/utils/logger';

interface PendingTimeChange {
  event: CalendarEvent;
  originalStart: Date;
  originalEnd: Date;
  newStart: Date;
  newEnd: Date;
}

function Planner() {
  const [searchQuery, setSearchQuery] = useState('');
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
    refetch 
  } = useCalendarEvents();
  
  // Configure top bar tabs for event types
  const plannerTabs: TopBarTab[] = useMemo(() => [
    { id: 'all', label: 'All' },
    { id: 'showing', label: 'Showings' },
    { id: 'move_in', label: 'Move-ins' },
    { id: 'inspection', label: 'Inspections' },
    { id: 'maintenance', label: 'Maintenance' },
  ], []);
  
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={CalendarIcon} title="Planner" />,
    center: <TopBarTabs tabs={plannerTabs} activeTab={activeTab} onTabChange={setActiveTab} />,
    right: canManageBookings ? (
      <Button size="sm" onClick={() => {
        setSelectedDate(new Date());
        setCreateDialogOpen(true);
      }}>
        Add event
      </Button>
    ) : undefined,
  }), [plannerTabs, activeTab, canManageBookings]);
  useTopBar(topBarConfig);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Time change reason dialog state
  const [timeChangeDialogOpen, setTimeChangeDialogOpen] = useState(false);
  const [pendingTimeChange, setPendingTimeChange] = useState<PendingTimeChange | null>(null);

  // Filter events based on active tab and search
  const filteredEvents = dbEvents.filter(event => {
    const matchesTab = activeTab === 'all' || event.type === activeTab;
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.property?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.community?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDetailOpen(true);
  };

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

  return (
    <main className="flex-1 bg-muted/30 h-full overflow-auto">
      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Tabs & Color Legend */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <AnimatedTabsList
              tabs={[
                { value: 'all', label: 'All Bookings' },
                { value: 'showing', label: 'Showings' },
                { value: 'move_in', label: 'Move-ins' },
                { value: 'inspection', label: 'Inspections' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
              activeValue={activeTab}
              onValueChange={setActiveTab}
            />
          </Tabs>

          {/* Color Legend */}
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: config.color }}
                />
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <FullCalendar
          events={filteredEvents}
          onDateClick={canManageBookings ? handleDateClick : undefined}
          onEventClick={handleEventClick}
          onAddEvent={canManageBookings ? handleAddEvent : undefined}
          onEventMove={canManageBookings ? handleEventMove : undefined}
          onEventResize={canManageBookings ? handleEventResize : undefined}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
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
