import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/types/calendar';

interface TimeChangeReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  originalStart: Date | null;
  originalEnd: Date | null;
  newStart: Date | null;
  newEnd: Date | null;
  onConfirm: (reason?: string) => void;
  onSkip: () => void;
}

const QUICK_REASONS = [
  'Schedule conflict',
  'Client request',
  'Weather/emergency',
  'Rescheduled by lead',
  'Staff availability',
  'Property not ready',
];

export const TimeChangeReasonDialog: React.FC<TimeChangeReasonDialogProps> = ({
  open,
  onOpenChange,
  event,
  originalStart,
  originalEnd,
  newStart,
  newEnd,
  onConfirm,
  onSkip,
}) => {
  const [reason, setReason] = useState('');
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null);

  const handleQuickReasonClick = (quickReason: string) => {
    if (selectedQuickReason === quickReason) {
      setSelectedQuickReason(null);
      setReason('');
    } else {
      setSelectedQuickReason(quickReason);
      setReason(quickReason);
    }
  };

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason('');
    setSelectedQuickReason(null);
  };

  const handleSkip = () => {
    onSkip();
    setReason('');
    setSelectedQuickReason(null);
  };

  const formatTimeRange = (start: Date | null, end: Date | null) => {
    if (!start || !end) return '';
    const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');
    if (sameDay) {
      return `${format(start, 'MMM d, yyyy')} • ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
    }
    return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'MMM d, h:mm a, yyyy')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Time Change Notification</DialogTitle>
          <DialogDescription>
            You're changing the time for "{event?.title}". Would you like to add a reason for this change?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Time change summary */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">From:</span>
              <span className="text-sm line-through text-muted-foreground">
                {formatTimeRange(originalStart, originalEnd)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase">To:</span>
              <span className="text-sm font-medium text-foreground">
                {formatTimeRange(newStart, newEnd)}
              </span>
            </div>
          </div>

          {/* Quick reason badges */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick select a reason:</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((quickReason) => (
                <Badge
                  key={quickReason}
                  variant={selectedQuickReason === quickReason ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleQuickReasonClick(quickReason)}
                >
                  {quickReason}
                </Badge>
              ))}
            </div>
          </div>

          {/* Custom reason textarea */}
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Or type a custom reason:
            </label>
            <Textarea
              id="reason"
              placeholder="Enter reason for time change..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setSelectedQuickReason(null);
              }}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="sm:order-1"
          >
            Save without reason
          </Button>
          <Button onClick={handleConfirm} className="sm:order-2">
            Save with reason
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
