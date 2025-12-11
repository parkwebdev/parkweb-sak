import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarDate, 
  Clock, 
  Mail01, 
  Phone, 
  User01, 
  Home02, 
  Building07
} from '@untitledui/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import type { CalendarEvent, EventType, EventStatus, RecurrenceRule } from '@/types/calendar';
import { EVENT_TYPE_CONFIG, EVENT_STATUS_CONFIG } from '@/types/calendar';

interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDelete: () => void;
  onMarkComplete: () => void;
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

const formatTimeValue = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes() < 30 ? '00' : '30';
  return `${hours}:${minutes}`;
};

export const EventDetailDialog: React.FC<EventDetailDialogProps> = ({
  open,
  onOpenChange,
  event,
  onUpdateEvent,
  onDelete,
  onMarkComplete,
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  
  // Edit form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [eventType, setEventType] = useState<EventType>('showing');
  const [status, setStatus] = useState<EventStatus>('confirmed');
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

  // Handle dialog close - reset mode immediately to prevent animation on reopen
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setMode('view');
    }
    onOpenChange(newOpen);
  };

  // Populate form when dialog opens or event changes
  useEffect(() => {
    if (open && event) {
      // Populate form state
      setTitle(event.title);
      setDate(new Date(event.start));
      setStartTime(formatTimeValue(new Date(event.start)));
      setEndTime(formatTimeValue(new Date(event.end)));
      setEventType(event.type || 'showing');
      setStatus(event.status || 'confirmed');
      setLeadName(event.lead_name || '');
      setLeadEmail(event.lead_email || '');
      setLeadPhone(event.lead_phone || '');
      setProperty(event.property || '');
      setCommunity(event.community || '');
      setNotes(event.notes || '');
      setIsRecurring(!!event.recurrence);
      setRecurrence(event.recurrence);
      setAllDay(event.allDay || false);
    }
  }, [open, event?.id]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !title || !event) return;

    setIsSubmitting(true);
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDate = new Date(date);
      startDate.setHours(startHour, startMinute, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(endHour, endMinute, 0, 0);

      onUpdateEvent({
        ...event,
        title,
        start: startDate,
        end: endDate,
        allDay,
        type: eventType,
        status,
        color: EVENT_TYPE_CONFIG[eventType!]?.color,
        lead_name: leadName || undefined,
        lead_email: leadEmail || undefined,
        lead_phone: leadPhone || undefined,
        property: property || undefined,
        community: community || undefined,
        notes: notes || undefined,
        recurrence: isRecurring ? recurrence : undefined,
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [date, title, event, startTime, endTime, eventType, status, leadName, leadEmail, leadPhone, property, community, notes, isRecurring, recurrence, allDay, onUpdateEvent, onOpenChange]);

  if (!event) return null;

  const typeConfig = event.type ? EVENT_TYPE_CONFIG[event.type] : null;
  const statusConfig = event.status ? EVENT_STATUS_CONFIG[event.status] : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden p-0">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'view' ? (
            <motion.div
              key="view"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-6"
            >
              <DialogHeader>
                <div className="flex items-center gap-2">
                  {typeConfig && (
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: typeConfig.color }}
                    />
                  )}
                  <DialogTitle>{event.title}</DialogTitle>
                </div>
                <DialogDescription>
                  View booking details and manage this event.
                </DialogDescription>
                <div className="flex items-center gap-2 pt-1">
                  {typeConfig && (
                    <Badge variant="secondary" className="text-xs">
                      {typeConfig.label}
                    </Badge>
                  )}
                  {statusConfig && (
                    <Badge variant={statusConfig.variant} className="text-xs">
                      {statusConfig.label}
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Date & Time */}
                <div className="flex items-center gap-3 text-sm">
                  <CalendarDate className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(event.start), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(event.start), 'h:mm a')} – {format(new Date(event.end), 'h:mm a')}
                  </span>
                </div>

                {/* Lead Info */}
                {(event.lead_name || event.lead_email || event.lead_phone) && (
                  <>
                    <Separator />
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Lead Contact
                      </h4>
                      {event.lead_name && (
                        <div className="flex items-center gap-3 text-sm">
                          <User01 className="h-4 w-4 text-muted-foreground" />
                          <span>{event.lead_name}</span>
                        </div>
                      )}
                      {event.lead_email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail01 className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`mailto:${event.lead_email}`}
                            className="text-primary hover:underline"
                          >
                            {event.lead_email}
                          </a>
                        </div>
                      )}
                      {event.lead_phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`tel:${event.lead_phone}`}
                            className="text-primary hover:underline"
                          >
                            {event.lead_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Property Info */}
                {(event.property || event.community) && (
                  <>
                    <Separator />
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Property Details
                      </h4>
                      {event.property && (
                        <div className="flex items-center gap-3 text-sm">
                          <Home02 className="h-4 w-4 text-muted-foreground" />
                          <span>{event.property}</span>
                        </div>
                      )}
                      {event.community && (
                        <div className="flex items-center gap-3 text-sm">
                          <Building07 className="h-4 w-4 text-muted-foreground" />
                          <span>{event.community}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Notes */}
                {event.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Notes
                      </h4>
                      <p className="text-sm text-muted-foreground">{event.notes}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  Delete
                </Button>
                <div className="flex items-center gap-2">
                  {event.status !== 'completed' && (
                    <Button variant="outline" size="sm" onClick={onMarkComplete}>
                      Complete
                    </Button>
                  )}
                  <Button size="sm" onClick={() => setMode('edit')}>
                    Edit
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-6 max-h-[90vh] overflow-y-auto"
            >
              <DialogHeader>
                <DialogTitle>Edit Booking</DialogTitle>
                <DialogDescription>
                  Update the details for this booking.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    placeholder="e.g., Home Showing - Johnson Family"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Event Type & Status */}
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
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENT_STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* All Day Toggle */}
                <div className="flex items-center justify-between h-10 px-3 border rounded-md bg-background">
                  <span className="text-sm">All-day event</span>
                  <Switch
                    id="edit-all-day"
                    checked={allDay}
                    onCheckedChange={setAllDay}
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
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

                  {!allDay && (
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
                  )}
                </div>

                {!allDay && (
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger className="w-1/2">
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
                )}

                {/* Recurrence Settings */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-recurring" className="text-sm font-medium">Repeat</Label>
                    <Switch
                      id="edit-recurring"
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
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Additional notes about this booking..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleOpenChange(false)} 
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!title || !date} loading={isSubmitting}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
