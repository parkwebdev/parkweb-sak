/**
 * ViewEventDialog Component
 * 
 * Dialog for viewing calendar event details with reschedule capability.
 * WCAG 2.2 compliant with keyboard alternatives for drag-and-drop (2.5.7).
 * @module components/calendar/ViewEventDialog
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  CalendarDate, 
  Clock, 
  Mail01, 
  Phone, 
  User01, 
  Home02, 
  Building07,
  RefreshCcw01
} from '@untitledui/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_CONFIG, EVENT_STATUS_CONFIG } from '@/types/calendar';

interface ViewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit: () => void;
  onDelete: () => void;
  onMarkComplete: () => void;
  /** WCAG 2.5.7: Keyboard alternative to reschedule event without drag */
  onReschedule?: (eventId: string, newStart: Date, newEnd: Date) => void;
}

export const ViewEventDialog: React.FC<ViewEventDialogProps> = ({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
  onMarkComplete,
  onReschedule,
}) => {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  if (!event) return null;

  const typeConfig = event.type ? EVENT_TYPE_CONFIG[event.type] : null;
  const statusConfig = event.status ? EVENT_STATUS_CONFIG[event.status] : null;

  const handleReschedule = () => {
    if (!onReschedule || !newDate || !newStartTime || !newEndTime) return;
    
    const [year, month, day] = newDate.split('-').map(Number);
    const [startHour, startMin] = newStartTime.split(':').map(Number);
    const [endHour, endMin] = newEndTime.split(':').map(Number);
    
    const newStart = new Date(year, month - 1, day, startHour, startMin);
    const newEnd = new Date(year, month - 1, day, endHour, endMin);
    
    onReschedule(event.id, newStart, newEnd);
    setShowReschedule(false);
    onOpenChange(false);
  };

  const initReschedule = () => {
    setNewDate(format(new Date(event.start), 'yyyy-MM-dd'));
    setNewStartTime(format(new Date(event.start), 'HH:mm'));
    setNewEndTime(format(new Date(event.end), 'HH:mm'));
    setShowReschedule(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {typeConfig && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: typeConfig.color }}
                aria-hidden="true"
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

        <div className="space-y-4 py-2">
          {/* Date & Time */}
          <div className="flex items-center gap-3 text-sm">
            <CalendarDate className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{format(new Date(event.start), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>
              {format(new Date(event.start), 'h:mm a')} – {format(new Date(event.end), 'h:mm a')}
            </span>
          </div>

          {/* WCAG 2.5.7: Keyboard alternative to reschedule */}
          {showReschedule ? (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Reschedule Event
              </h4>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="reschedule-date" className="text-xs">Date</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="reschedule-start" className="text-xs">Start Time</Label>
                    <Input
                      id="reschedule-start"
                      type="time"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      size="sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reschedule-end" className="text-xs">End Time</Label>
                    <Input
                      id="reschedule-end"
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowReschedule(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleReschedule}>
                  Confirm Reschedule
                </Button>
              </div>
            </div>
          ) : onReschedule && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={initReschedule}
              className="w-full"
              aria-label="Open reschedule form to change event date and time"
            >
              <RefreshCcw01 className="h-4 w-4 mr-2" aria-hidden="true" />
              Reschedule
            </Button>
          )}

          {/* Lead Info */}
          {(event.lead_name || event.lead_email || event.lead_phone) && (
            <>
              <Separator />
              <div className="space-y-2.5">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Lead Contact
                </h3>
                {event.lead_name && (
                  <div className="flex items-center gap-3 text-sm">
                    <User01 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>{event.lead_name}</span>
                  </div>
                )}
                {event.lead_email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail01 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                    <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Property Details
                </h3>
                {event.property && (
                  <div className="flex items-center gap-3 text-sm">
                    <Home02 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span>{event.property}</span>
                  </div>
                )}
                {event.community && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building07 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Notes
                </h3>
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
            aria-label="Delete this event"
          >
            Delete
          </Button>
          <div className="flex items-center gap-2">
            {event.status !== 'completed' && (
              <Button variant="outline" size="sm" onClick={onMarkComplete}>
                Complete
              </Button>
            )}
            <Button size="sm" onClick={onEdit}>
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
