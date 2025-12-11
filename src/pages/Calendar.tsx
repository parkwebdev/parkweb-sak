import React, { useState } from 'react';
import { SearchLg, Plus, Calendar as CalendarIcon, Link01 } from '@untitledui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FullCalendar } from '@/components/calendar/FullCalendar';
import { EmptyState } from '@/components/ui/empty-state';
import type { CalendarEvent } from '@/types/calendar';

// Placeholder events for demonstration
const placeholderEvents: CalendarEvent[] = [];

const Calendar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [events] = useState<CalendarEvent[]>(placeholderEvents);

  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date);
    // Future: Open create event dialog
  };

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    // Future: Open event details sheet
  };

  const hasEvents = events.length > 0;

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
            <Button size="default">
              <Plus className="h-4 w-4 mr-2" />
              New Event
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

      {/* Calendar Content */}
      <div className="flex-1 px-6 pb-6">
        {hasEvents ? (
          <FullCalendar
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            className="h-full"
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={<CalendarIcon className="h-5 w-5 text-muted-foreground" />}
              title="No events yet"
              description="Connect your calendar or create your first event to get started with bookings and appointments."
              action={
                <div className="flex items-center gap-3">
                  <Button variant="outline">
                    <Link01 className="h-4 w-4 mr-2" />
                    Connect Calendar
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </div>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
