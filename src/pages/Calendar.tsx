import React, { useState, useCallback, useMemo } from 'react';
import { SearchLg } from '@untitledui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FullCalendar } from '@/components/calendar/FullCalendar';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { ViewEventDialog } from '@/components/calendar/ViewEventDialog';
import { EditEventDialog } from '@/components/calendar/EditEventDialog';
import { DeleteEventDialog } from '@/components/calendar/DeleteEventDialog';
import { TimeChangeReasonDialog } from '@/components/calendar/TimeChangeReasonDialog';
import type { CalendarEvent, TimeChangeRecord } from '@/types/calendar';
import { EVENT_TYPE_CONFIG } from '@/types/calendar';

interface PendingTimeChange {
  event: CalendarEvent;
  originalStart: Date;
  originalEnd: Date;
  newStart: Date;
  newEnd: Date;
}

// Helper to create demo events relative to today
const createSampleEvents = (): CalendarEvent[] => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  return [
    {
      id: '1',
      title: 'Home Showing - Johnson Family',
      start: new Date(todayStart.getTime() + 10 * 60 * 60 * 1000), // Today at 10:00 AM
      end: new Date(todayStart.getTime() + 11 * 60 * 60 * 1000), // Today at 11:00 AM
      type: 'showing',
      color: '#3B82F6',
      lead_name: 'Sarah Johnson',
      lead_email: 'sarah.johnson@email.com',
      lead_phone: '(555) 123-4567',
      property: 'Lot 42 - 3BR/2BA Clayton Home',
      community: 'Sunset Valley MHP',
      status: 'confirmed',
      notes: 'Family of 4, interested in schools nearby. First-time home buyers.'
    },
    {
      id: '2',
      title: 'Move-in Walkthrough - Martinez',
      start: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000), // Tomorrow at 2:00 PM
      end: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 + 15.5 * 60 * 60 * 1000), // Tomorrow at 3:30 PM
      type: 'move_in',
      color: '#10B981',
      lead_name: 'Carlos Martinez',
      lead_email: 'carlos.m@email.com',
      lead_phone: '(555) 234-5678',
      property: 'Lot 18 - 2BR/1BA Champion',
      community: 'Riverside Estates',
      status: 'confirmed',
      notes: 'Bringing utility setup documents. Keys handoff scheduled.'
    },
    {
      id: '3',
      title: 'Annual Inspection - Lot 7',
      start: new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000), // 2 days at 9:00 AM
      end: new Date(todayStart.getTime() + 2 * 24 * 60 * 60 * 1000 + 10.5 * 60 * 60 * 1000), // 2 days at 10:30 AM
      type: 'inspection',
      color: '#F59E0B',
      property: 'Lot 7 - 3BR/2BA Skyline',
      community: 'Pinewood Community',
      status: 'pending',
      notes: 'Annual safety inspection. Check HVAC and water heater.'
    },
    {
      id: '4',
      title: 'Home Showing - Williams',
      start: new Date(todayStart.getTime() + 4 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000), // 4 days at 11:00 AM
      end: new Date(todayStart.getTime() + 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 4 days at 12:00 PM
      type: 'showing',
      color: '#3B82F6',
      lead_name: 'Michael Williams',
      lead_email: 'm.williams@email.com',
      lead_phone: '(555) 345-6789',
      property: 'Lot 23 - 4BR/2BA Palm Harbor',
      community: 'Sunset Valley MHP',
      status: 'confirmed',
      notes: 'Relocating from out of state. Pre-approved financing.'
    },
    {
      id: '5',
      title: 'HVAC Maintenance - Lot 31',
      start: new Date(todayStart.getTime() + 5 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000), // 5 days at 8:00 AM
      end: new Date(todayStart.getTime() + 5 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 5 days at 10:00 AM
      type: 'maintenance',
      color: '#8B5CF6',
      property: 'Lot 31 - 2BR/2BA Fleetwood',
      community: 'Riverside Estates',
      status: 'confirmed',
      notes: 'Scheduled AC unit service. Tenant notified.'
    },
    {
      id: '6',
      title: 'Community Meeting',
      start: new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000), // 7 days at 6:00 PM
      end: new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000 + 19.5 * 60 * 60 * 1000), // 7 days at 7:30 PM
      type: 'meeting',
      color: '#6366F1',
      community: 'Sunset Valley MHP',
      status: 'confirmed',
      notes: 'Monthly community meeting. Agenda: Holiday decorations, parking rules.'
    },
    // Overlapping event to test conflict detection (conflicts with event 1)
    {
      id: '7',
      title: 'Overlapping Meeting',
      start: new Date(todayStart.getTime() + 10.5 * 60 * 60 * 1000), // Today at 10:30 AM
      end: new Date(todayStart.getTime() + 12 * 60 * 60 * 1000), // Today at 12:00 PM
      type: 'meeting',
      color: '#EC4899',
      status: 'confirmed',
    },
    {
      id: '8',
      title: 'Move-in Walkthrough - Thompson',
      start: new Date(todayStart.getTime() + 11 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000), // 11 days at 10:00 AM
      end: new Date(todayStart.getTime() + 11 * 24 * 60 * 60 * 1000 + 11.5 * 60 * 60 * 1000), // 11 days at 11:30 AM
      type: 'move_in',
      color: '#10B981',
      lead_name: 'David Thompson',
      lead_email: 'd.thompson@email.com',
      lead_phone: '(555) 567-8901',
      property: 'Lot 12 - 2BR/1BA Oakwood',
      community: 'Riverside Estates',
      status: 'confirmed',
      notes: 'Final walkthrough before key handoff tomorrow.'
    },
  ];
};

const sampleEvents = createSampleEvents();

const Calendar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Time change reason dialog state
  const [timeChangeDialogOpen, setTimeChangeDialogOpen] = useState(false);
  const [pendingTimeChange, setPendingTimeChange] = useState<PendingTimeChange | null>(null);

  // Filter events based on active tab and search
  const filteredEvents = events.filter(event => {
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
    setViewDialogOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedDate(new Date());
    setCreateDialogOpen(true);
  };

  const handleCreateEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const event: CalendarEvent = {
      ...newEvent,
      id: crypto.randomUUID(),
    };
    setEvents(prev => [...prev, event]);
    setCreateDialogOpen(false);
  };

  // Apply time change with optional reason
  const applyTimeChange = useCallback((reason?: string) => {
    if (!pendingTimeChange) return;
    
    const { event, originalStart, originalEnd, newStart, newEnd } = pendingTimeChange;
    
    const timeChangeRecord: TimeChangeRecord = {
      timestamp: new Date(),
      previousStart: originalStart,
      previousEnd: originalEnd,
      newStart,
      newEnd,
      reason,
    };
    
    setEvents(prev => prev.map(e => {
      if (e.id === event.id) {
        return {
          ...e,
          start: newStart,
          end: newEnd,
          time_change_history: [...(e.time_change_history || []), timeChangeRecord],
        };
      }
      return e;
    }));
    
    setPendingTimeChange(null);
    setTimeChangeDialogOpen(false);
  }, [pendingTimeChange]);

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
        setEditDialogOpen(false);
        return;
      }
    }
    
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setEditDialogOpen(false);
    setViewDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
      setDeleteDialogOpen(false);
      setViewDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleMarkComplete = () => {
    if (selectedEvent) {
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, status: 'completed' } : e));
      setViewDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleEditFromView = () => {
    setViewDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleDeleteFromView = () => {
    setViewDialogOpen(false);
    setDeleteDialogOpen(true);
  };

  // Handle drag-based time changes (move)
  const handleEventMove = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    const event = events.find(e => e.id === eventId);
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
  }, [events]);

  // Handle resize-based time changes
  const handleEventResize = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    const event = events.find(e => e.id === eventId);
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
  }, [events]);

  return (
    <main className="flex-1 bg-muted/30 h-full overflow-auto">
      <PageHeader
        title="Calendar"
        description="Manage your property showings and bookings"
      >
        <div className="relative w-full lg:w-80">
          <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="default">
          Connect Calendar
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
        />
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialDate={selectedDate || undefined}
        onCreateEvent={handleCreateEvent}
      />

      <ViewEventDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        event={selectedEvent}
        onEdit={handleEditFromView}
        onDelete={handleDeleteFromView}
        onMarkComplete={handleMarkComplete}
      />

      <EditEventDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        event={selectedEvent}
        onUpdateEvent={handleUpdateEvent}
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
      />
    </main>
  );
};

export default Calendar;
