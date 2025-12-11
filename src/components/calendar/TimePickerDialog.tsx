import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TimePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDate: Date;
  eventTitle: string;
  onConfirm: (hour: number, minute: number) => void;
  defaultHour?: number;
  defaultMinute?: number;
}

// Generate time options
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
const MINUTES = [0, 15, 30, 45];

export const TimePickerDialog: React.FC<TimePickerDialogProps> = ({
  open,
  onOpenChange,
  targetDate,
  eventTitle,
  onConfirm,
  defaultHour = 9,
  defaultMinute = 0,
}) => {
  const [selectedHour, setSelectedHour] = useState(defaultHour);
  const [selectedMinute, setSelectedMinute] = useState(defaultMinute);

  const handleConfirm = () => {
    onConfirm(selectedHour, selectedMinute);
    onOpenChange(false);
  };

  const formatHour = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    return format(date, 'h a');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Set Event Time</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            Moving "<span className="font-medium text-foreground">{eventTitle}</span>" to{' '}
            <span className="font-medium text-foreground">{format(targetDate, 'EEEE, MMMM d')}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="hour">Hour</Label>
              <Select
                value={selectedHour.toString()}
                onValueChange={(v) => setSelectedHour(parseInt(v))}
              >
                <SelectTrigger id="hour">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {formatHour(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="minute">Minute</Label>
              <Select
                value={selectedMinute.toString()}
                onValueChange={(v) => setSelectedMinute(parseInt(v))}
              >
                <SelectTrigger id="minute">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((minute) => (
                    <SelectItem key={minute} value={minute.toString()}>
                      {minute.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            New time: <span className="font-medium text-foreground">
              {formatHour(selectedHour).replace(' ', ':')}
              {selectedMinute.toString().padStart(2, '0')}{' '}
              {selectedHour >= 12 ? 'PM' : 'AM'}
            </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Move Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
