import React, { useState, useCallback } from 'react';
import { SearchLg, Link01 } from '@untitledui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FullCalendar } from '@/components/calendar/FullCalendar';
import { CreateEventDialog } from '@/components/calendar/CreateEventDialog';
import { ViewEventDialog } from '@/components/calendar/ViewEventDialog';
import { EditEventDialog } from '@/components/calendar/EditEventDialog';
import { DeleteEventDialog } from '@/components/calendar/DeleteEventDialog';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_CONFIG } from '@/types/calendar';

// Mobile home park booking sample data
const sampleEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Home Showing - Johnson Family',
    start: new Date(2025, 11, 11, 10, 0),
    end: new Date(2025, 11, 11, 11, 0),
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
    start: new Date(2025, 11, 12, 14, 0),
    end: new Date(2025, 11, 12, 15, 30),
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
    start: new Date(2025, 11, 13, 9, 0),
    end: new Date(2025, 11, 13, 10, 30),
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
    start: new Date(2025, 11, 15, 11, 0),
    end: new Date(2025, 11, 15, 12, 0),
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
    start: new Date(2025, 11, 16, 8, 0),
    end: new Date(2025, 11, 16, 10, 0),
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
    start: new Date(2025, 11, 18, 18, 0),
    end: new Date(2025, 11, 18, 19, 30),
    type: 'meeting',
    color: '#6366F1',
    community: 'Sunset Valley MHP',
    status: 'confirmed',
    notes: 'Monthly community meeting. Agenda: Holiday decorations, parking rules.'
  },
  {
    id: '7',
    title: 'Home Showing - Garcia Family',
    start: new Date(2025, 11, 19, 14, 0),
    end: new Date(2025, 11, 19, 15, 0),
    type: 'showing',
    color: '#3B82F6',
    lead_name: 'Maria Garcia',
    lead_email: 'maria.g@email.com',
    lead_phone: '(555) 456-7890',
    property: 'Lot 55 - 3BR/2BA Clayton',
    community: 'Pinewood Community',
    status: 'pending',
    notes: 'Downsizing from larger home. Interested in senior-friendly features.'
  },
  {
    id: '8',
    title: 'Move-in Walkthrough - Thompson',
    start: new Date(2025, 11, 22, 10, 0),
    end: new Date(2025, 11, 22, 11, 30),
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

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
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
      handleUpdateEvent({ ...selectedEvent, status: 'completed' });
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

  const handleEventMove = useCallback((eventId: string, newStart: Date, newEnd: Date) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, start: newStart, end: newEnd }
        : event
    ));
  }, []);

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
          <Link01 className="h-4 w-4 mr-2" />
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
    </main>
  );
};

export default Calendar;
