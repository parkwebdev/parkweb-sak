import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Repeat02 } from '@untitledui/icons';
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
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  addDays, addMonths, subMonths, addWeeks, subWeeks,
  isSameMonth, isSameDay, isToday, getWeek, getHours, setHours, setMinutes,
  differenceInMinutes, addMinutes
} from 'date-fns';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { expandRecurringEvents } from '@/lib/recurrence';
import { ResizableEvent } from './ResizableEvent';
import { DroppableTimeSlot } from './DroppableTimeSlot';
import { DroppableDayCell } from './DroppableDayCell';
import { DraggedEventPreview } from './DraggedEventPreview';
import type { CalendarEvent, CalendarView } from '@/types/calendar';

// Time slots for week/day view (6 AM to 10 PM)
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => i + 6);
const HOUR_HEIGHT = 60; // pixels per hour

interface FullCalendarProps {
  events?: CalendarEvent[];
  className?: string;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: () => void;
  onEventMove?: (eventId: string, newStart: Date, newEnd: Date) => void;
  onEventResize?: (eventId: string, newStart: Date, newEnd: Date) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const FullCalendar: React.FC<FullCalendarProps> = ({
  events = [],
  className,
  onDateClick,
  onEventClick,
  onAddEvent,
  onEventMove,
  onEventResize,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [activeDragEvent, setActiveDragEvent] = useState<CalendarEvent | null>(null);
  const [resizingEventId, setResizingEventId] = useState<string | null>(null);
  const [resizePreviewEnd, setResizePreviewEnd] = useState<Date | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Expand recurring events for the current view
  const expandedEvents = useMemo(() => {
    const viewStart = view === 'month' ? calendarStart : 
                      view === 'week' ? startOfWeek(currentDate) : 
                      currentDate;
    const viewEnd = view === 'month' ? calendarEnd : 
                    view === 'week' ? endOfWeek(currentDate) : 
                    addDays(currentDate, 1);
    return expandRecurringEvents(events, viewStart, viewEnd);
  }, [events, view, currentDate, calendarStart, calendarEnd]);

  // Use distance-only constraints - resize conflict handled by isResizeIntent flag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: view === 'month' ? 5 : 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const draggedEvent = expandedEvents.find(e => e.id === event.active.id);
    setActiveDragEvent(draggedEvent || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragEvent(null);
    if (!event.over || !event.active || !onEventMove) return;
    
    const eventId = event.active.id as string;
    const dropData = event.over.data.current as { type?: string; date: Date; hour?: number; minute?: number } | undefined;
    if (!dropData) return;
    
    const originalEvent = expandedEvents.find(e => e.id === eventId);
    if (!originalEvent) return;
    
    // For recurring instances, use the original event ID
    const actualEventId = originalEvent.recurrence_id || eventId;
    
    const duration = differenceInMinutes(new Date(originalEvent.end), new Date(originalEvent.start));
    
    // Handle month view day drops - move to new date, preserve original time
    if (dropData.type === 'day') {
      const targetDate = new Date(dropData.date);
      const originalStart = new Date(originalEvent.start);
      
      // Preserve original time, change only the date
      const newStart = setMinutes(
        setHours(targetDate, originalStart.getHours()), 
        originalStart.getMinutes()
      );
      const newEnd = addMinutes(newStart, duration);
      
      onEventMove(actualEventId, newStart, newEnd);
      return;
    }
    
    // Handle week/day view time slot drops
    if (dropData.hour !== undefined && dropData.minute !== undefined) {
      const newStart = setMinutes(setHours(new Date(dropData.date), dropData.hour), dropData.minute);
      const newEnd = addMinutes(newStart, duration);
      onEventMove(actualEventId, newStart, newEnd);
    }
  };

  // Resize handlers
  const handleResizeStart = useCallback((eventId: string) => {
    setResizingEventId(eventId);
  }, []);

  const handleResizeMove = useCallback((eventId: string, newEndTime: Date) => {
    setResizePreviewEnd(newEndTime);
  }, []);

  const handleResizeEnd = useCallback((eventId: string, newEndTime: Date) => {
    const event = expandedEvents.find(e => e.id === eventId);
    if (event && onEventResize) {
      const actualEventId = event.recurrence_id || eventId;
      onEventResize(actualEventId, new Date(event.start), newEndTime);
    }
    setResizingEventId(null);
    setResizePreviewEnd(null);
  }, [expandedEvents, onEventResize]);

  // Auto-scroll to current time in week/day views
  useEffect(() => {
    if ((view === 'week' || view === 'day') && scrollContainerRef.current) {
      const currentHour = new Date().getHours();
      const scrollToHour = Math.max(currentHour - 2, 6);
      const scrollPosition = (scrollToHour - 6) * HOUR_HEIGHT;
      scrollContainerRef.current.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
  }, [view]);

  // View-aware navigation
  const goToPrevious = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const goToNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  // Dynamic header title based on view
  const getHeaderTitle = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`;
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  // Get events that START in a specific hour (for positioning)
  const getEventsStartingInHour = (date: Date, hour: number) => {
    return expandedEvents.filter((event) => {
      if (event.allDay) return false;
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, date) && getHours(eventDate) === hour;
    });
  };

  // Get all-day events for a date
  const getAllDayEvents = (date: Date) => {
    return expandedEvents.filter((event) => event.allDay && isSameDay(new Date(event.start), date));
  };

  // Calculate event style for duration-based rendering
  const getEventStyle = useCallback((event: CalendarEvent, slotHour: number) => {
    const eventStart = new Date(event.start);
    // Use preview end time if this event is being resized
    const eventEnd = (resizingEventId === event.id && resizePreviewEnd) 
      ? resizePreviewEnd 
      : new Date(event.end);
    const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;
    const durationMinutes = differenceInMinutes(eventEnd, eventStart);
    const durationHours = durationMinutes / 60;
    
    const topOffset = (startHour - slotHour) * HOUR_HEIGHT;
    const height = Math.max(durationHours * HOUR_HEIGHT, 24); // min 24px height
    
    return {
      position: 'absolute' as const,
      top: `${topOffset}px`,
      height: `${height}px`,
      left: '2px',
      right: '2px',
      zIndex: resizingEventId === event.id ? 20 : 10,
    };
  }, [resizingEventId, resizePreviewEnd]);

  // Generate all days for the calendar grid
  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return expandedEvents.filter(event => isSameDay(new Date(event.start), date));
  };

  const today = new Date();

  // Render month view grid
  const renderMonthView = () => (
    <>
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
      <div className="grid grid-cols-7">
        {days.map((dayDate, index) => {
          const dayEvents = getEventsForDay(dayDate);
          const isCurrentMonth = isSameMonth(dayDate, currentDate);
          const isTodayDate = isToday(dayDate);
          const isLastRow = index >= days.length - 7;

          return (
            <DroppableDayCell
              key={index}
              date={dayDate}
              className={cn(
                "min-h-[130px] p-2 border-r border-b border-border cursor-pointer transition-colors hover:bg-accent/50",
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
                  <ResizableEvent
                    key={event.id}
                    event={event}
                    onClick={() => onEventClick?.(event)}
                    variant="month"
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2 font-medium">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </DroppableDayCell>
          );
        })}
      </div>
    </>
  );

  // Render current time indicator line
  const renderCurrentTimeLine = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentHour < 6 || currentHour > 22) return null;
    
    const topPosition = ((currentHour - 6) * HOUR_HEIGHT) + (currentMinutes * HOUR_HEIGHT / 60);
    
    return (
      <div 
        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
        style={{ top: `${topPosition}px` }}
      >
        <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
        <div className="flex-1 border-t-2 border-destructive" />
      </div>
    );
  };

  // Render week view with time grid
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hasAllDayEvents = weekDays.some(d => getAllDayEvents(d).length > 0);

    return (
      <div className="flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30">
          <div className="p-2" />
          {weekDays.map((day) => (
            <div key={day.toISOString()} className="p-2 text-center border-l border-border">
              <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
              <div
                className={cn(
                  "text-lg font-medium mx-auto flex items-center justify-center",
                  isToday(day) && "bg-primary text-primary-foreground rounded-full w-8 h-8"
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* All-day events row */}
        {hasAllDayEvents && (
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/20">
            <div className="text-xs text-muted-foreground p-1 text-right pr-2">All day</div>
            {weekDays.map((day) => {
              const allDayEvents = getAllDayEvents(day);
              return (
                <div key={day.toISOString() + '-allday'} className="border-l border-border p-1 min-h-[32px]">
                  {allDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer mb-0.5"
                      style={{
                        backgroundColor: event.color ? `${event.color}20` : 'hsl(var(--primary) / 0.1)',
                        color: event.color || 'hsl(var(--primary))',
                      }}
                      onClick={() => onEventClick?.(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Time grid */}
        <div ref={scrollContainerRef} className="overflow-y-auto max-h-[600px] relative">
          {renderCurrentTimeLine()}
          {TIME_SLOTS.map((hour) => (
            <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)]" style={{ height: `${HOUR_HEIGHT}px` }}>
              <div className="text-xs text-muted-foreground p-1 text-right pr-2 border-r border-border">
                {format(setHours(new Date(), hour), 'h a')}
              </div>
              {weekDays.map((day) => {
                const cellEvents = getEventsStartingInHour(day, hour);
                return (
                  <div
                    key={day.toISOString() + hour}
                    className="border-l border-t border-border relative"
                  >
                    {/* Droppable time slots */}
                    <DroppableTimeSlot 
                      date={day} 
                      hour={hour} 
                      minute={0} 
                      onClick={() => onDateClick?.(setMinutes(setHours(day, hour), 0))}
                    />
                    <DroppableTimeSlot 
                      date={day} 
                      hour={hour} 
                      minute={30} 
                      onClick={() => onDateClick?.(setMinutes(setHours(day, hour), 30))}
                    />
                    {/* Resizable events */}
                    {cellEvents.map((event) => (
                      <ResizableEvent
                        key={event.id}
                        event={event}
                        style={getEventStyle(event, hour)}
                        onClick={() => onEventClick?.(event)}
                        onResizeStart={handleResizeStart}
                        onResizeMove={handleResizeMove}
                        onResizeEnd={handleResizeEnd}
                        variant="week"
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render day view with single column time grid
  const renderDayView = () => {
    const allDayEvents = getAllDayEvents(currentDate);
    
    return (
      <div className="flex flex-col">
        {/* Day header */}
        <div className="p-4 text-center border-b border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">{format(currentDate, 'EEEE')}</div>
          <div
            className={cn(
              "text-3xl font-semibold mx-auto flex items-center justify-center",
              isToday(currentDate) && "text-primary"
            )}
          >
            {format(currentDate, 'd')}
          </div>
        </div>

        {/* All-day events row */}
        {allDayEvents.length > 0 && (
          <div className="grid grid-cols-[60px_1fr] border-b border-border bg-muted/20">
            <div className="text-xs text-muted-foreground p-2 text-right pr-2">All day</div>
            <div className="p-2 space-y-1">
              {allDayEvents.map((event) => (
                <div
                  key={event.id}
                  className="text-sm px-2 py-1.5 rounded cursor-pointer"
                  style={{
                    backgroundColor: event.color ? `${event.color}20` : 'hsl(var(--primary) / 0.1)',
                    color: event.color || 'hsl(var(--primary))',
                    borderLeft: `3px solid ${event.color || 'hsl(var(--primary))'}`,
                  }}
                  onClick={() => onEventClick?.(event)}
                >
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time grid */}
        <div ref={view === 'day' ? scrollContainerRef : undefined} className="overflow-y-auto max-h-[600px] relative">
          {renderCurrentTimeLine()}
          {TIME_SLOTS.map((hour) => {
            const cellEvents = getEventsStartingInHour(currentDate, hour);
            return (
              <div key={hour} className="grid grid-cols-[60px_1fr]" style={{ height: `${HOUR_HEIGHT}px` }}>
                <div className="text-xs text-muted-foreground p-1 text-right pr-2 border-r border-border">
                  {format(setHours(new Date(), hour), 'h a')}
                </div>
                <div className="border-t border-border relative">
                  {/* Droppable time slots */}
                  <DroppableTimeSlot 
                    date={currentDate} 
                    hour={hour} 
                    minute={0} 
                    onClick={() => onDateClick?.(setMinutes(setHours(currentDate, hour), 0))}
                  />
                  <DroppableTimeSlot 
                    date={currentDate} 
                    hour={hour} 
                    minute={30} 
                    onClick={() => onDateClick?.(setMinutes(setHours(currentDate, hour), 30))}
                  />
                  {/* Resizable events */}
                  {cellEvents.map((event) => (
                    <ResizableEvent
                      key={event.id}
                      event={event}
                      style={getEventStyle(event, hour)}
                      onClick={() => onEventClick?.(event)}
                      onResizeStart={handleResizeStart}
                      onResizeMove={handleResizeMove}
                      onResizeEnd={handleResizeEnd}
                      variant="day"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
        {/* Enhanced Calendar Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-4 border-b border-border">
          {/* Left: Mini date + Title info */}
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
            
            {/* Dynamic title + week badge */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {getHeaderTitle()}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  Week {getWeek(currentDate)}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {view === 'month' 
                  ? `${format(monthStart, 'MMM d, yyyy')} – ${format(monthEnd, 'MMM d, yyyy')}`
                  : view === 'week'
                  ? `${format(startOfWeek(currentDate), 'MMM d')} – ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
                  : format(currentDate, 'MMMM yyyy')
                }
              </span>
            </div>
          </div>
          
          {/* Right: Navigation + View + Add Event */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={goToPrevious}>
                ‹
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={goToNext}>
                ›
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
              Add event
            </Button>
          </div>
        </div>

        {/* Render based on selected view */}
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragEvent && <DraggedEventPreview event={activeDragEvent} />}
      </DragOverlay>
    </DndContext>
  );
};
