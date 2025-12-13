/**
 * LocationDetails Component
 * 
 * Clean, minimal form for viewing and editing location details with auto-save.
 * Uses light visual hierarchy and generous whitespace.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from '@untitledui/icons';
import { BusinessHoursEditor } from './BusinessHoursEditor';
import { CalendarConnections } from './CalendarConnections';
import { US_TIMEZONES, type BusinessHours, type LocationFormData } from '@/types/locations';
import type { Tables } from '@/integrations/supabase/types';

type Location = Tables<'locations'>;

interface LocationDetailsProps {
  location: Location;
  agentId: string;
  onUpdate: (id: string, data: Partial<LocationFormData>) => Promise<boolean>;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  location,
  agentId,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<LocationFormData>({
    name: location.name,
    address: location.address || '',
    city: location.city || '',
    state: location.state || '',
    zip: location.zip || '',
    country: location.country || 'US',
    timezone: location.timezone || 'America/New_York',
    phone: location.phone || '',
    email: location.email || '',
    business_hours: (location.business_hours as BusinessHours) || {},
    wordpress_slug: location.wordpress_slug || '',
  });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [calendarsOpen, setCalendarsOpen] = useState(false);

  // Reset form when location changes
  useEffect(() => {
    setFormData({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      zip: location.zip || '',
      country: location.country || 'US',
      timezone: location.timezone || 'America/New_York',
      phone: location.phone || '',
      email: location.email || '',
      business_hours: (location.business_hours as BusinessHours) || {},
      wordpress_slug: location.wordpress_slug || '',
    });
  }, [location.id]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Use ref to avoid recreating debouncedSave when onUpdate changes
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Auto-save with debounce - stable reference
  const debouncedSave = useCallback(
    (data: Partial<LocationFormData>) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(async () => {
        await onUpdateRef.current(location.id, data);
      }, 1000);
    },
    [location.id]
  );

  const handleChange = (field: keyof LocationFormData, value: string | BusinessHours | string[]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    debouncedSave({ [field]: value });
  };

  return (
    <div className="space-y-8 py-2">
      {/* Name - Most prominent */}
      <div>
        <Label htmlFor="name" className="text-xs text-muted-foreground mb-1.5 block">Location Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Downtown Community"
          className="text-lg font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
        />
      </div>

      {/* Address Fields */}
      <div className="space-y-4">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Address</span>
        
        <div>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Street Address"
            className="h-9"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="City"
            className="h-9"
          />
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="State"
            className="h-9"
          />
          <Input
            id="zip"
            value={formData.zip}
            onChange={(e) => handleChange('zip', e.target.value)}
            placeholder="ZIP"
            className="h-9"
          />
        </div>

        <Select
          value={formData.timezone}
          onValueChange={(value) => handleChange('timezone', value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Timezone" />
          </SelectTrigger>
          <SelectContent>
            {US_TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contact Fields */}
      <div className="space-y-4">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">Contact</span>
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Phone"
            className="h-9"
          />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Email"
            className="h-9"
          />
        </div>
      </div>

      {/* WordPress - only show if has data */}
      {(location.wordpress_slug || location.wordpress_community_id) && (
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">WordPress</span>
          <Input
            id="wordpress_slug"
            value={formData.wordpress_slug || ''}
            onChange={(e) => handleChange('wordpress_slug', e.target.value)}
            placeholder="Community slug"
            className="h-9"
          />
          {location.wordpress_community_id && (
            <p className="text-xs text-muted-foreground">ID: {location.wordpress_community_id}</p>
          )}
        </div>
      )}

      {/* Business Hours - Collapsible */}
      <Collapsible open={hoursOpen} onOpenChange={setHoursOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2">
          {hoursOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Business Hours</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <BusinessHoursEditor
            value={formData.business_hours || {}}
            onChange={(hours) => handleChange('business_hours', hours)}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Calendars - Collapsible */}
      <Collapsible open={calendarsOpen} onOpenChange={setCalendarsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2">
          {calendarsOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Connected Calendars</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <CalendarConnections
            locationId={location.id}
            agentId={agentId}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
