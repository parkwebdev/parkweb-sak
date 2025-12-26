/**
 * CreateScheduledReportDialog Component
 * 
 * Dialog for creating automated scheduled reports.
 * Configures frequency, recipients, and report content.
 * @module components/analytics/CreateScheduledReportDialog
 */

import { useState } from 'react';
import { logger } from '@/utils/logger';
import { isValidEmail } from '@/utils/validation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useScheduledReports } from '@/hooks/useScheduledReports';
import { Badge } from '@/components/ui/badge';
import { X } from '@untitledui/icons';

interface CreateScheduledReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateScheduledReportDialog = ({ open, onOpenChange }: CreateScheduledReportDialogProps) => {
  const { createReport } = useScheduledReports();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);

  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (email && !recipients.includes(email)) {
      if (isValidEmail(email)) {
        setRecipients([...recipients, email]);
        setRecipientInput('');
      }
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSubmit = async () => {
    if (!name || recipients.length === 0) {
      return;
    }

    setLoading(true);
    try {
      await createReport({
        name,
        recipients,
        frequency,
        day_of_week: frequency === 'weekly' ? dayOfWeek : null,
        day_of_month: frequency === 'monthly' ? dayOfMonth : null,
        time_of_day: `${timeOfDay}:00`,
        report_config: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          filters: {
            agentId: 'all',
            leadStatus: 'all',
            conversationStatus: 'all',
          },
        },
        active: true,
      });

      // Reset form
      setName('');
      setRecipients([]);
      setFrequency('weekly');
      setTimeOfDay('09:00');
      onOpenChange(false);
    } catch (error) {
      logger.error('Error creating scheduled report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Report</DialogTitle>
          <DialogDescription>
            Create an automated report that will be sent to your team on a regular basis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Report Name</Label>
            <Input
              id="name"
              placeholder="e.g., Weekly Team Summary"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v: 'daily' | 'weekly' | 'monthly') => setFrequency(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Day Selection (for weekly/monthly) */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Time of Day</Label>
            <Input
              id="time"
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Email Recipients</Label>
            <div className="flex gap-2">
              <Input
                id="recipient"
                type="email"
                placeholder="email@example.com"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
              />
              <Button type="button" onClick={handleAddRecipient}>Add</Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!name || recipients.length === 0}
              loading={loading}
            >
              Create Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
