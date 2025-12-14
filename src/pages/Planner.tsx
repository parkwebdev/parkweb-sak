/**
 * Planner Page (Calendar)
 * 
 * Full-featured calendar for scheduling property showings, move-ins,
 * inspections, and maintenance. Supports month/week/day views,
 * drag-and-drop, event resizing, recurrence, and conflict detection.
 * 
 * @page
 */

import React, { useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from '@untitledui/icons';
import { GoogleCalendarLogo, MicrosoftOutlookLogo } from '@/components/icons/CalendarLogos';
import { FullCalendar } from '@/components/calendar/FullCalendar';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { EventDetailDialog } from '@/components/calendar/EventDetailDialog';
import { DeleteEventDialog } from '@/components/calendar/DeleteEventDialog';
import { TimeChangeReasonDialog } from '@/components/calendar/TimeChangeReasonDialog';
import { LoadingState } from '@/components/ui/loading-state';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import type { CalendarEvent, TimeChangeRecord } from '@/types/calendar';
import { EVENT_TYPE_CONFIG } from '@/types/calendar';

interface PendingTimeChange {
  event: CalendarEvent;
  originalStart: Date;
  originalEnd: Date;
  newStart: Date;
  newEnd: Date;
}

const Planner: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch real calendar events from database
  const { 
    events: dbEvents, 
    isLoading, 
    cancelEvent, 
    completeEvent, 
    rescheduleEvent,
    refetch 
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
    console.log('Create event:', newEvent);
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
    return (
      <main className="flex-1 bg-muted/30 h-full overflow-auto">
        <PageHeader
          title="Planner"
          description="Manage your property showings and bookings"
        />
        <div className="flex items-center justify-center h-[60vh]">
          <LoadingState text="Loading calendar..." />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-muted/30 h-full overflow-auto">
      <PageHeader
        title="Planner"
        description="Manage your property showings and bookings"
      >
      <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Connect Calendar
              <ChevronDown size={16} className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50">
            <DropdownMenuItem className="gap-2">
              <GoogleCalendarLogo className="w-4 h-4" />
              Google Calendar
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <MicrosoftOutlookLogo className="w-4 h-4" />
              Outlook Calendar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={handleAddEvent}>
          Add event
        </Button>
      </PageHeader>

      <div className="px-4 lg:px-8 mt-6 pb-8 space-y-6">
        {/* Tabs & Color Legend */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Bookings</TabsTrigger>
              <TabsTrigger value="showing">Showings</TabsTrigger>
              <TabsTrigger value="move_in">Move-ins</TabsTrigger>
              <TabsTrigger value="inspection">Inspections</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>
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
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onAddEvent={handleAddEvent}
          onEventMove={handleEventMove}
          onEventResize={handleEventResize}
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
        onDelete={handleDeleteFromDetail}
        onMarkComplete={handleMarkComplete}
        existingEvents={dbEvents}
      />

      <DeleteEventDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        event={selectedEvent}
        onConfirmDelete={handleDeleteEvent}
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
