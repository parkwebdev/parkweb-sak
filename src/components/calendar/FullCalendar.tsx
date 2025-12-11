import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday } from 'date-fns';
import type { CalendarEvent } from '@/types/calendar';

interface FullCalendarProps {
  events?: CalendarEvent[];
  className?: string;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const FullCalendar: React.FC<FullCalendarProps> = ({
  events = [],
  className,
  onDateClick,
  onEventClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Generate all days for the calendar grid
  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.start), date));
  };

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="px-3 py-2 text-xs font-medium text-muted-foreground text-center"
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((dayDate, index) => {
          const dayEvents = getEventsForDay(dayDate);
          const isCurrentMonth = isSameMonth(dayDate, currentDate);
          const isTodayDate = isToday(dayDate);

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-2 border-b border-r border-border cursor-pointer transition-colors hover:bg-accent/50",
                !isCurrentMonth && "bg-muted/30",
                index % 7 === 6 && "border-r-0"
              )}
              onClick={() => onDateClick?.(dayDate)}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={cn(
                    "w-7 h-7 flex items-center justify-center text-sm rounded-full",
                    isTodayDate && "bg-primary text-primary-foreground font-medium",
                    !isTodayDate && isCurrentMonth && "text-foreground",
                    !isCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {format(dayDate, 'd')}
                </span>
              </div>
              
              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors",
                      "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    style={event.color ? { backgroundColor: `${event.color}20`, color: event.color } : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
