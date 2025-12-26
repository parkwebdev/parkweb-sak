import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { RecurrenceSettings } from './RecurrenceSettings';
import { ConflictWarning } from './ConflictWarningBanner';
import type { CalendarEvent, EventType, RecurrenceRule } from '@/types/calendar';
import { EVENT_TYPE_CONFIG } from '@/types/calendar';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onCreateEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  existingEvents?: CalendarEvent[];
}

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  const ampm = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return {
    value: `${hour.toString().padStart(2, '0')}:${minute}`,
    label: `${displayHour}:${minute} ${ampm}`,
  };
});

export const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  open,
  onOpenChange,
  initialDate,
  onCreateEvent,
  existingEvents = [],
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(initialDate || new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [eventType, setEventType] = useState<EventType>('showing');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [property, setProperty] = useState('');
  const [community, setCommunity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | undefined>(undefined);
  const [allDay, setAllDay] = useState(false);

  // Sync date and time when initialDate prop changes
  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
      const hour = initialDate.getHours();
      const minutes = initialDate.getMinutes();
      const startTimeValue = `${hour.toString().padStart(2, '0')}:${minutes >= 30 ? '30' : '00'}`;
      setStartTime(startTimeValue);
      // Auto-set end time to 1 hour later
      const endHour = hour + 1;
      setEndTime(`${endHour.toString().padStart(2, '0')}:${minutes >= 30 ? '30' : '00'}`);
    }
  }, [initialDate]);

  const resetForm = () => {
    setTitle('');
    setDate(initialDate || new Date());
    const hour = initialDate?.getHours() ?? 9;
    const minutes = initialDate?.getMinutes() ?? 0;
    setStartTime(`${hour.toString().padStart(2, '0')}:${minutes >= 30 ? '30' : '00'}`);
    setEndTime(`${(hour + 1).toString().padStart(2, '0')}:${minutes >= 30 ? '30' : '00'}`);
    setEventType('showing');
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
    setProperty('');
    setCommunity('');
    setNotes('');
    setIsRecurring(false);
    setRecurrence(undefined);
    setAllDay(false);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title) return;

    setIsSubmitting(true);
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(endHour, endMinute, 0, 0);

      onCreateEvent({
        title,
        start: startDate,
        end: endDate,
        allDay,
        type: eventType,
        color: EVENT_TYPE_CONFIG[eventType!]?.color,
        lead_name: leadName || undefined,
        lead_email: leadEmail || undefined,
        lead_phone: leadPhone || undefined,
        property: property || undefined,
        community: community || undefined,
        notes: notes || undefined,
        status: 'confirmed',
        source: 'native',
        recurrence: isRecurring ? recurrence : undefined,
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [date, title, startTime, endTime, eventType, leadName, leadEmail, leadPhone, property, community, notes, isRecurring, recurrence, allDay, onCreateEvent, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>
            Schedule a new showing, move-in, or appointment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Home Showing - Johnson Family"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Event Type & All Day */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex items-center justify-between h-10 px-3 border rounded-md bg-background">
                <span className="text-sm">All-day event</span>
                <Switch
                  id="all-day"
                  checked={allDay}
                  onCheckedChange={setAllDay}
                />
              </div>
            </div>
          </div>

          {/* Date - Full Width */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start & End Time - Same Row */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </div>
          )}

          {/* Conflict Warning */}
          <ConflictWarning
            date={date}
            startTime={startTime}
            endTime={endTime}
            allDay={allDay}
            existingEvents={existingEvents}
          />

          {/* Recurrence Settings */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurring" className="text-sm font-medium">Repeat</Label>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>
            {isRecurring && date && (
              <RecurrenceSettings
                recurrence={recurrence}
                onChange={setRecurrence}
                baseDate={date}
              />
            )}
          </div>

          {/* Lead Info */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium text-muted-foreground">Lead Information</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Lead Name"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
              />
              <Input
                placeholder="Phone"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
              />
            </div>
            <Input
              placeholder="Email"
              type="email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
            />
          </div>

          {/* Property Info */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium text-muted-foreground">Property Details</Label>
            <Input
              placeholder="Property (e.g., Lot 42 - 3BR/2BA Clayton Home)"
              value={property}
              onChange={(e) => setProperty(e.target.value)}
            />
            <Input
              placeholder="Community (e.g., Sunset Valley MHP)"
              value={community}
              onChange={(e) => setCommunity(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this booking..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title || !date} loading={isSubmitting}>
            Create Booking
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
