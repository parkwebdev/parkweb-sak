/**
 * LocationDetails Component
 * 
 * Form for viewing and editing location details with auto-save.
 * Includes business hours editor and calendar connections.
 * 
 * @module components/agents/locations/LocationDetails
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { SavedIndicator } from '@/components/settings/SavedIndicator';
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
  const [isSaved, setIsSaved] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

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
    setIsSaved(true);
  }, [location.id]);

  // Auto-save with debounce
  const debouncedSave = useCallback(
    (data: Partial<LocationFormData>) => {
      if (saveTimeout) clearTimeout(saveTimeout);
      setIsSaved(false);
      
      const timeout = setTimeout(async () => {
        const success = await onUpdate(location.id, data);
        if (success) setIsSaved(true);
      }, 1000);
      
      setSaveTimeout(timeout);
    },
    [location.id, onUpdate, saveTimeout]
  );

  const handleChange = (field: keyof LocationFormData, value: string | BusinessHours | string[]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    debouncedSave({ [field]: value });
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full">
      {/* Save indicator */}
      <div className="flex justify-end">
        <SavedIndicator show={isSaved} duration={0} />
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Location Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Downtown Community"
            />
          </div>
          
          <div className="col-span-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Main Street"
            />
          </div>
          
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Austin"
            />
          </div>
          
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="TX"
            />
          </div>
          
          <div>
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={formData.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
              placeholder="78701"
            />
          </div>
          
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleChange('timezone', value)}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(512) 555-0100"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="info@example.com"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Business Hours */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Business Hours</h3>
        <BusinessHoursEditor
          value={formData.business_hours || {}}
          onChange={(hours) => handleChange('business_hours', hours)}
        />
      </div>

      <Separator />

      {/* WordPress Integration */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">WordPress Integration</h3>
        <div>
          <Label htmlFor="wordpress_slug">WordPress Community Slug</Label>
          <Input
            id="wordpress_slug"
            value={formData.wordpress_slug || ''}
            onChange={(e) => handleChange('wordpress_slug', e.target.value)}
            placeholder="e.g., forge-at-the-lake"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            The URL slug of the community on your WordPress site.
          </p>
        </div>
        {location.wordpress_community_id && (
          <div className="text-xs text-muted-foreground">
            WordPress ID: {location.wordpress_community_id}
          </div>
        )}
      </div>

      <Separator />

      {/* Calendar Connections */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Connected Calendars</h3>
        <CalendarConnections
          locationId={location.id}
          agentId={agentId}
        />
      </div>
    </div>
  );
};
