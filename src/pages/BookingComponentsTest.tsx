/**
 * Booking Components Test Page
 * 
 * Interactive preview of the multi-step booking flow components.
 * Accessible at /booking-test route.
 */

import { useState } from 'react';
import { DayPicker, TimePicker, BookingConfirmed } from '@/widget/components/booking';
import type { DayPickerData, TimePickerData, BookingConfirmationData, BookingDay, BookingTime } from '@/widget/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

// Mock data - only available days/times
const mockDayPickerData: DayPickerData = {
  locationName: 'Clearview Estates',
  locationId: 'loc_123',
  days: [
    { date: '2024-12-16', dayName: 'Mon', dayNumber: 16, hasAvailability: true, isToday: true },
    { date: '2024-12-17', dayName: 'Tue', dayNumber: 17, hasAvailability: true },
    { date: '2024-12-18', dayName: 'Wed', dayNumber: 18, hasAvailability: true },
    { date: '2024-12-20', dayName: 'Fri', dayNumber: 20, hasAvailability: true },
    { date: '2024-12-21', dayName: 'Sat', dayNumber: 21, hasAvailability: true },
    { date: '2024-12-23', dayName: 'Mon', dayNumber: 23, hasAvailability: true },
    { date: '2024-12-24', dayName: 'Tue', dayNumber: 24, hasAvailability: true },
    { date: '2024-12-26', dayName: 'Thu', dayNumber: 26, hasAvailability: true },
  ],
};

const mockTimePickerData: TimePickerData = {
  locationName: 'Clearview Estates',
  locationId: 'loc_123',
  selectedDate: '2024-12-18',
  selectedDayDisplay: 'Wednesday, December 18',
  times: [
    { time: '9 AM', datetime: '2024-12-18T09:00:00', available: true },
    { time: '10 AM', datetime: '2024-12-18T10:00:00', available: true },
    { time: '12 PM', datetime: '2024-12-18T12:00:00', available: true },
    { time: '1 PM', datetime: '2024-12-18T13:00:00', available: true },
    { time: '2 PM', datetime: '2024-12-18T14:00:00', available: true },
    { time: '4 PM', datetime: '2024-12-18T16:00:00', available: true },
    { time: '5 PM', datetime: '2024-12-18T17:00:00', available: true },
    { time: '6 PM', datetime: '2024-12-18T18:00:00', available: true },
  ],
};

const mockBookingConfirmation: BookingConfirmationData = {
  locationName: 'Clearview Estates',
  date: 'Wednesday, December 18, 2024',
  time: '10:00 AM',
  confirmationId: 'BK-2024-1218-001',
  calendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Property+Tour&dates=20241218T100000/20241218T103000',
};

export default function BookingComponentsTest() {
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    toast.info(message);
  };

  const handleDaySelect = (day: BookingDay) => {
    addLog(`Day selected: ${day.dayName} ${day.dayNumber} (${day.date})`);
    addLog(`→ Would send message: "${day.dayName}, December ${day.dayNumber}"`);
    setActiveStep(2);
  };

  const handleTimeSelect = (time: BookingTime) => {
    addLog(`Time selected: ${time.time} (${time.datetime})`);
    addLog(`→ Would send message: "${time.time} works for me"`);
    setActiveStep(3);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Booking Components Test</h1>
          <p className="text-muted-foreground">Preview the multi-step booking flow</p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2">
            <Label htmlFor="color">Primary Color:</Label>
            <Input
              id="color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-8 p-0 border-0"
            />
            <span className="text-xs text-muted-foreground font-mono">{primaryColor}</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={activeStep === 1 ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveStep(1)}
            >
              Step 1: Day
            </Button>
            <Button 
              variant={activeStep === 2 ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveStep(2)}
            >
              Step 2: Time
            </Button>
            <Button 
              variant={activeStep === 3 ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveStep(3)}
            >
              Step 3: Confirm
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
            Clear Logs
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Widget Preview */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Widget Preview (~380px)</h2>
            
            {/* Simulated widget container */}
            <div 
              className="max-w-[380px] mx-auto rounded-2xl border bg-background shadow-lg overflow-hidden"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {/* Widget header */}
              <div 
                className="p-4 text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <p className="font-semibold">Ari</p>
                <p className="text-sm opacity-80">AI Assistant</p>
              </div>

              {/* Chat area */}
              <div className="p-4 min-h-[300px] bg-muted/30">
                {/* AI Message bubble */}
                <div className="max-w-[85%]">
                  <div className="bg-card rounded-2xl rounded-tl-md p-3 shadow-sm border">
                    {activeStep === 1 && (
                      <>
                        <p className="text-sm">Great! What day works best for you this week?</p>
                        <DayPicker 
                          data={mockDayPickerData} 
                          onSelect={handleDaySelect}
                          primaryColor={primaryColor}
                        />
                      </>
                    )}
                    
                    {activeStep === 2 && (
                      <>
                        <p className="text-sm">Perfect! I have these times available:</p>
                        <TimePicker 
                          data={mockTimePickerData} 
                          onSelect={handleTimeSelect}
                          primaryColor={primaryColor}
                        />
                      </>
                    )}
                    
                    {activeStep === 3 && (
                      <>
                        <p className="text-sm">You're all set! Here's your confirmation:</p>
                        <BookingConfirmed 
                          data={mockBookingConfirmation}
                          primaryColor={primaryColor}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interaction Log */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Interaction Log</h2>
            <div className="rounded-lg border bg-card p-4 min-h-[300px] font-mono text-xs space-y-1 overflow-auto max-h-[500px]">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Click on days or times to see interactions...</p>
              ) : (
                logs.map((log, i) => (
                  <p key={i} className={log.startsWith('→') ? 'text-primary pl-2' : 'text-foreground'}>
                    {log}
                  </p>
                ))
              )}
            </div>

            {/* All Components Preview */}
            <h2 className="text-lg font-semibold mt-8 mb-4">All Components (Side by Side)</h2>
            <div className="space-y-6">
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-xs font-medium text-muted-foreground mb-2">DayPicker</p>
                <DayPicker 
                  data={mockDayPickerData} 
                  onSelect={handleDaySelect}
                  primaryColor={primaryColor}
                />
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-xs font-medium text-muted-foreground mb-2">TimePicker</p>
                <TimePicker 
                  data={mockTimePickerData} 
                  onSelect={handleTimeSelect}
                  primaryColor={primaryColor}
                />
              </div>
              
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-xs font-medium text-muted-foreground mb-2">BookingConfirmed</p>
                <BookingConfirmed 
                  data={mockBookingConfirmation}
                  primaryColor={primaryColor}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
