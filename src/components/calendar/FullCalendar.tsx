import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, getWeek } from 'date-fns';
import type { CalendarEvent, CalendarView } from '@/types/calendar';

interface FullCalendarProps {
  events?: CalendarEvent[];
  className?: string;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const FullCalendar: React.FC<FullCalendarProps> = ({
  events = [],
  className,
  onDateClick,
  onEventClick,
  onAddEvent,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

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

  const today = new Date();

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden flex flex-col", className)}>
      {/* Enhanced Calendar Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-4 border-b border-border">
        {/* Left: Mini date + Month info */}
        <div className="flex items-center gap-4">
          {/* Mini date indicator */}
          <div className="flex flex-col items-center justify-center bg-muted rounded-lg px-3 py-1.5 min-w-[52px]">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {format(today, 'MMM')}
            </span>
            <span className="text-xl font-semibold text-foreground leading-tight">
              {format(today, 'd')}
            </span>
          </div>
          
          {/* Month title + week + date range */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <Badge variant="secondary" className="text-xs">
                Week {getWeek(currentDate)}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {format(monthStart, 'MMM d, yyyy')} – {format(monthEnd, 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        
        {/* Right: Navigation + View + Add Event */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* View Selector */}
          <Select value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Month view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month view</SelectItem>
              <SelectItem value="week">Week view</SelectItem>
              <SelectItem value="day">Day view</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Add Event Button */}
          <Button onClick={onAddEvent}>
            <Plus className="h-4 w-4 mr-2" />
            Add event
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="px-3 py-2.5 text-xs font-medium text-muted-foreground text-center"
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1">
        {days.map((dayDate, index) => {
          const dayEvents = getEventsForDay(dayDate);
          const isCurrentMonth = isSameMonth(dayDate, currentDate);
          const isTodayDate = isToday(dayDate);
          const isLastRow = index >= days.length - 7;

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-2 border-r border-b border-border cursor-pointer transition-colors hover:bg-accent/50",
                !isCurrentMonth && "bg-muted/30",
                index % 7 === 6 && "border-r-0",
                isLastRow && "border-b-0"
              )}
              onClick={() => onDateClick?.(dayDate)}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={cn(
                    "w-7 h-7 flex items-center justify-center text-sm rounded-full transition-colors",
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
                    className="flex items-center gap-1.5 text-xs px-2 py-1 rounded truncate cursor-pointer transition-colors"
                    style={{
                      backgroundColor: event.color ? `${event.color}15` : undefined,
                      color: event.color || 'hsl(var(--primary))',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color || 'hsl(var(--primary))' }}
                    />
                    <span className="font-medium truncate">
                      {format(new Date(event.start), 'h:mm a')}
                    </span>
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2 font-medium">
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
