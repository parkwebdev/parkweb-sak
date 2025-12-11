import React from 'react';
import { format } from 'date-fns';
import { 
  CalendarDate, 
  Clock, 
  Mail01, 
  Phone, 
  User01, 
  Home02, 
  Building07,
  Edit02,
  Trash01,
  CheckCircle
} from '@untitledui/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_CONFIG, EVENT_STATUS_CONFIG } from '@/types/calendar';

interface ViewEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  onEdit: () => void;
  onDelete: () => void;
  onMarkComplete: () => void;
}

export const ViewEventDialog: React.FC<ViewEventDialogProps> = ({
  open,
  onOpenChange,
  event,
  onEdit,
  onDelete,
  onMarkComplete,
}) => {
  if (!event) return null;

  const typeConfig = event.type ? EVENT_TYPE_CONFIG[event.type] : null;
  const statusConfig = event.status ? EVENT_STATUS_CONFIG[event.status] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {typeConfig && (
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: typeConfig.color }}
                  />
                )}
                <DialogTitle className="text-lg">{event.title}</DialogTitle>
              </div>
              <div className="flex items-center gap-2 mt-2">
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
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
            <Trash01 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <div className="flex items-center gap-2">
            {event.status !== 'completed' && (
              <Button variant="outline" size="sm" onClick={onMarkComplete}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            )}
            <Button size="sm" onClick={onEdit}>
              <Edit02 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
