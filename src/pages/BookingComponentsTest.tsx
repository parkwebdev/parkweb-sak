/**
 * Booking Components Test Page
 * 
 * Interactive test page for the multi-step booking flow components.
 * Route: /booking-test
 */

import { useState, useMemo } from 'react';
import { DayPicker, TimePicker, BookingConfirmed } from '@/widget/components/booking';
import type { DayPickerData, TimePickerData, BookingConfirmationData, BookingDay, BookingTime } from '@/widget/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/lib/toast';

// Mock data for testing
const mockDayPickerData: DayPickerData = {
  locationName: 'Clearview Estates',
  locationId: 'loc_123',
  phoneNumber: '(555) 123-4567',
  days: [
    { date: '2024-12-16', dayName: 'Mon', dayNumber: 16, hasAvailability: true },
    { date: '2024-12-17', dayName: 'Tue', dayNumber: 17, hasAvailability: true },
    { date: '2024-12-18', dayName: 'Wed', dayNumber: 18, hasAvailability: true, isToday: true },
    { date: '2024-12-19', dayName: 'Thu', dayNumber: 19, hasAvailability: true },
    { date: '2024-12-20', dayName: 'Fri', dayNumber: 20, hasAvailability: true },
    { date: '2024-12-21', dayName: 'Sat', dayNumber: 21, hasAvailability: true },
    { date: '2024-12-22', dayName: 'Sun', dayNumber: 22, hasAvailability: true },
    { date: '2024-12-23', dayName: 'Mon', dayNumber: 23, hasAvailability: true },
  ],
};

const mockTimePickerData: TimePickerData = {
  locationName: 'Clearview Estates',
  locationId: 'loc_123',
  phoneNumber: '(555) 123-4567',
  selectedDate: '2024-12-18',
  selectedDayDisplay: 'Wednesday, December 18',
  times: [
    { time: '9 AM', datetime: '2024-12-18T09:00:00', available: true },
    { time: '10 AM', datetime: '2024-12-18T10:00:00', available: true },
    { time: '11 AM', datetime: '2024-12-18T11:00:00', available: true },
    { time: '1 PM', datetime: '2024-12-18T13:00:00', available: true },
    { time: '2 PM', datetime: '2024-12-18T14:00:00', available: true },
    { time: '3 PM', datetime: '2024-12-18T15:00:00', available: true },
    { time: '4 PM', datetime: '2024-12-18T16:00:00', available: true },
    { time: '5 PM', datetime: '2024-12-18T17:00:00', available: true },
  ],
};

// Empty state mock data
const emptyDayPickerData: DayPickerData = {
  locationName: 'Clearview Estates',
  locationId: 'loc_123',
  phoneNumber: '(555) 123-4567',
  days: [],
};

const emptyTimePickerData: TimePickerData = {
  locationName: 'Clearview Estates',
  locationId: 'loc_123',
  phoneNumber: '(555) 123-4567',
  selectedDate: '2024-12-18',
  selectedDayDisplay: 'Wednesday, December 18',
  times: [],
};

export default function BookingComponentsTest() {
  const [primaryColor, setPrimaryColor] = useState('#8B5CF6');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Track user selections
  const [selectedDay, setSelectedDay] = useState<BookingDay | null>(null);
  const [selectedTime, setSelectedTime] = useState<BookingTime | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    toast.info(message);
  };

  const handleDaySelect = (day: BookingDay) => {
    setSelectedDay(day);
    addLog(`Selected day: ${day.dayName} ${day.dayNumber} (${day.date})`);
    // Simulate loading delay then advance
    setTimeout(() => setActiveStep(2), 500);
  };

  const handleTimeSelect = (time: BookingTime) => {
    setSelectedTime(time);
    addLog(`Selected time: ${time.time} (${time.datetime})`);
    // Simulate loading delay then advance
    setTimeout(() => setActiveStep(3), 500);
  };

  const handleGoBack = () => {
    addLog('User clicked "Pick a different day"');
    setSelectedTime(null);
    setActiveStep(1);
  };

  // Build dynamic time picker data based on selected day
  const dynamicTimePickerData: TimePickerData = useMemo(() => {
    if (!selectedDay) return showEmptyState ? emptyTimePickerData : mockTimePickerData;
    
    const date = new Date(selectedDay.date);
    const formattedDay = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Update times to use the selected date
    const updatedTimes = mockTimePickerData.times.map(t => ({
      ...t,
      datetime: t.datetime.replace(/\d{4}-\d{2}-\d{2}/, selectedDay.date),
    }));
    
    return {
      ...mockTimePickerData,
      selectedDate: selectedDay.date,
      selectedDayDisplay: formattedDay,
      times: showEmptyState ? [] : updatedTimes,
    };
  }, [selectedDay, showEmptyState]);

  // Build dynamic confirmation data based on selections
  const dynamicConfirmationData: BookingConfirmationData = useMemo(() => {
    if (!selectedDay || !selectedTime) {
      return {
        locationName: mockDayPickerData.locationName,
        address: '1234 Main Street, Springfield, IL 62701',
        phoneNumber: mockDayPickerData.phoneNumber,
        date: 'Select a day first',
        time: 'Select a time first',
        startDateTime: '',
        endDateTime: '',
      };
    }
    
    const date = new Date(selectedDay.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Calculate end time (30 min after start)
    const startDateTime = selectedTime.datetime.replace(/\d{4}-\d{2}-\d{2}/, selectedDay.date);
    const endDate = new Date(startDateTime);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    return {
      locationName: mockDayPickerData.locationName,
      address: '1234 Main Street, Springfield, IL 62701',
      phoneNumber: mockDayPickerData.phoneNumber,
      date: formattedDate,
      time: selectedTime.time,
      startDateTime,
      endDateTime: endDate.toISOString(),
    };
  }, [selectedDay, selectedTime]);

  const dayData = showEmptyState ? emptyDayPickerData : mockDayPickerData;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Booking Components Test</h1>
          <p className="text-muted-foreground mt-1">
            Interactive test page for the multi-step booking flow.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-end gap-4 p-4 bg-card border border-border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <Input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-10 p-1 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="emptyState"
              checked={showEmptyState}
              onCheckedChange={setShowEmptyState}
            />
            <Label htmlFor="emptyState">Show Empty States</Label>
          </div>

          <div className="flex gap-2">
            <Button
              variant={activeStep === 1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveStep(1)}
            >
              Step 1: Days
            </Button>
            <Button
              variant={activeStep === 2 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveStep(2)}
            >
              Step 2: Times
            </Button>
            <Button
              variant={activeStep === 3 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveStep(3)}
            >
              Step 3: Confirmed
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => {
            setLogs([]);
            setSelectedDay(null);
            setSelectedTime(null);
            setActiveStep(1);
          }}>
            Reset
          </Button>
        </div>

        {/* Selection Status */}
        {(selectedDay || selectedTime) && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <span className="font-medium">Current selections:</span>
            {selectedDay && <span className="ml-2">Day: {selectedDay.dayName} {selectedDay.dayNumber}</span>}
            {selectedTime && <span className="ml-2">• Time: {selectedTime.time}</span>}
          </div>
        )}

        {/* Main Preview */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Widget Preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Widget Preview</h2>
            <div 
              className="bg-card border border-border rounded-xl p-4"
              style={{ maxWidth: 380 }}
            >
              {/* Simulated message bubble */}
              <div className="bg-muted rounded-lg p-3 mb-2">
                <p className="text-sm text-foreground">
                  {activeStep === 1 && "Great! I'd love to help you schedule a tour. Which day works best for you?"}
                  {activeStep === 2 && `Perfect! What time works best for you on ${dynamicTimePickerData.selectedDayDisplay}?`}
                  {activeStep === 3 && "Your tour is all set! Here are the details:"}
                </p>
              </div>

              {/* Booking component */}
              {activeStep === 1 && (
                <DayPicker
                  data={dayData}
                  onSelect={handleDaySelect}
                  primaryColor={primaryColor}
                />
              )}
              {activeStep === 2 && (
                <TimePicker
                  data={dynamicTimePickerData}
                  onSelect={handleTimeSelect}
                  onGoBack={handleGoBack}
                  primaryColor={primaryColor}
                />
              )}
              {activeStep === 3 && (
                <BookingConfirmed
                  data={dynamicConfirmationData}
                  primaryColor={primaryColor}
                />
              )}
            </div>
          </div>

          {/* Interaction Log */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Interaction Log</h2>
            <div className="bg-card border border-border rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-muted-foreground">Interactions will appear here...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-muted-foreground py-0.5">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* All Components Side by Side */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">All Components</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">DayPicker</p>
              <DayPicker
                data={dayData}
                onSelect={handleDaySelect}
                primaryColor={primaryColor}
              />
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">TimePicker</p>
              <TimePicker
                data={dynamicTimePickerData}
                onSelect={handleTimeSelect}
                onGoBack={handleGoBack}
                primaryColor={primaryColor}
              />
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">BookingConfirmed</p>
              <BookingConfirmed
                data={dynamicConfirmationData}
                primaryColor={primaryColor}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}