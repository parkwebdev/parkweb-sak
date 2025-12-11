import React, { useState } from 'react';
import { SearchLg, Plus, Link01 } from '@untitledui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FullCalendar } from '@/components/calendar/FullCalendar';
import type { CalendarEvent } from '@/types/calendar';

// Sample events for demonstration
const sampleEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Marketing site kickoff',
    start: new Date(2025, 11, 2, 9, 30),
    end: new Date(2025, 11, 2, 10, 30),
    color: '#3B82F6'
  },
  {
    id: '2',
    title: 'Team standup',
    start: new Date(2025, 11, 5, 9, 0),
    end: new Date(2025, 11, 5, 9, 30),
    color: '#8B5CF6'
  },
  {
    id: '3',
    title: 'Design review',
    start: new Date(2025, 11, 11, 14, 0),
    end: new Date(2025, 11, 11, 15, 0),
    color: '#10B981'
  },
  {
    id: '4',
    title: 'Product planning',
    start: new Date(2025, 11, 11, 10, 0),
    end: new Date(2025, 11, 11, 11, 30),
    color: '#F59E0B'
  },
  {
    id: '5',
    title: 'Client call',
    start: new Date(2025, 11, 15, 11, 0),
    end: new Date(2025, 11, 15, 12, 0),
    color: '#EF4444'
  },
  {
    id: '6',
    title: 'Sprint retrospective',
    start: new Date(2025, 11, 18, 15, 0),
    end: new Date(2025, 11, 18, 16, 0),
    color: '#06B6D4'
  },
  {
    id: '7',
    title: 'Quarterly review',
    start: new Date(2025, 11, 22, 13, 0),
    end: new Date(2025, 11, 22, 14, 30),
    color: '#8B5CF6'
  },
];

const Calendar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [events] = useState<CalendarEvent[]>(sampleEvents);

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
    // Future: Open create event dialog
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    // Future: Open event details sheet
  };

  const handleAddEvent = () => {
    console.log('Add event clicked');
    // Future: Open create event dialog
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="px-6 pt-6 pb-4 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <PageHeader
            title="Calendar"
            description="Manage your bookings and appointments"
          />
          <div className="flex items-center gap-3">
            <div className="relative w-full lg:w-80">
              <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="default">
              <Link01 className="h-4 w-4 mr-2" />
              Connect Calendar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="booked">Booked</TabsTrigger>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Content - Always show */}
      <div className="flex-1 px-6 pb-6">
        <FullCalendar
          events={events}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
          onAddEvent={handleAddEvent}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default Calendar;
