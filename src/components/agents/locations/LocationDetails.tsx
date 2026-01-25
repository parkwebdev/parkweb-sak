/**
 * LocationDetails Component
 * 
 * Clean, minimal form for viewing and editing location details with silent auto-save.
 * Uses 500ms debounce standard - no visual saved indicators.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, InfoCircle } from '@untitledui/icons';
import { AnimatedItem } from '@/components/ui/animated-item';
import { BusinessHoursEditor } from './BusinessHoursEditor';
import { CalendarConnections } from './CalendarConnections';
import { SocialConnections } from './SocialConnections';
import { US_TIMEZONES, type BusinessHours, type LocationFormData } from '@/types/locations';
import type { Tables } from '@/integrations/supabase/types';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';

type Location = Tables<'locations'>;

interface LocationDetailsProps {
  location: Location;
  agentId: string;
  onUpdate: (id: string, data: Partial<LocationFormData>) => Promise<boolean>;
}

export function LocationDetails({
  location,
  agentId,
  onUpdate,
}: LocationDetailsProps) {
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
  const [hoursOpen, setHoursOpen] = useState(false);

  // Check for agent-level default calendar (for fallback indicator)
  const { accounts: locationCalendars } = useConnectedAccounts(location.id, agentId);
  const { accounts: agentCalendars } = useConnectedAccounts(undefined, agentId);
  
  const hasLocationCalendar = locationCalendars.length > 0;
  const hasAgentDefaultCalendar = agentCalendars.length > 0;
  const isUsingFallback = !hasLocationCalendar && hasAgentDefaultCalendar;

  // Use ref to avoid recreating save when onUpdate changes
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

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

  const { save } = useAutoSave({
    onSave: async (data: Partial<LocationFormData>) => {
      await onUpdateRef.current(location.id, data);
    },
  });

  const handleChange = (field: keyof LocationFormData, value: string | BusinessHours | string[]) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    save({ [field]: value });
  };

  return (
    <div className="space-y-5">
      {/* Name - Most prominent */}
      <AnimatedItem>
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
      </AnimatedItem>

      {/* Connected Calendars - Always visible */}
      <AnimatedItem>
      <div className="space-y-2 p-3 rounded-card bg-muted/30">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Connected Calendars</span>
          
          {/* Fallback indicator */}
          {isUsingFallback && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/10">
              <InfoCircle size={14} className="text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Using default calendar from Ari Integrations. Connect a calendar here for location-specific scheduling.
              </p>
            </div>
          )}
          
          <CalendarConnections
            locationId={location.id}
            agentId={agentId}
          />
        </div>
      </AnimatedItem>

      {/* Social Accounts - Always visible */}
      <AnimatedItem>
        <div className="space-y-2 p-3 rounded-card bg-muted/30">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Social Accounts</span>
          <SocialConnections
            locationId={location.id}
            agentId={agentId}
          />
        </div>
      </AnimatedItem>

      {/* Address Fields */}
      <AnimatedItem>
        <div className="space-y-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Address</span>
          
          <div>
            <Input
              id="address"
              size="sm"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Street Address"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <Input
              id="city"
              size="sm"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="City"
            />
            <Input
              id="state"
              size="sm"
              value={formData.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="State"
            />
            <Input
              id="zip"
              size="sm"
              value={formData.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
              placeholder="ZIP"
            />
          </div>

          <Select
            value={formData.timezone}
            onValueChange={(value) => handleChange('timezone', value)}
          >
            <SelectTrigger size="sm">
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
      </AnimatedItem>

      {/* Contact Fields */}
      <AnimatedItem>
        <div className="space-y-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Contact</span>
          
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="phone"
              type="tel"
              size="sm"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="Phone"
            />
            <Input
              id="email"
              type="email"
              size="sm"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email"
            />
          </div>
        </div>
      </AnimatedItem>

      {/* URL Slug - only show if has data */}
      {(location.wordpress_slug || location.wordpress_community_id) && (
        <AnimatedItem>
          <div className="space-y-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">URL Slug</span>
            <Input
              id="wordpress_slug"
              size="sm"
              value={formData.wordpress_slug || ''}
              readOnly
              disabled
              className="bg-muted/50"
              placeholder="Community slug"
            />
            {location.wordpress_community_id && (
              <p className="text-xs text-muted-foreground">Post ID: {location.wordpress_community_id}</p>
            )}
          </div>
        </AnimatedItem>
      )}

      {/* Business Hours - Collapsible */}
      <AnimatedItem>
        <Collapsible open={hoursOpen} onOpenChange={setHoursOpen} lazy>
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
      </AnimatedItem>
    </div>
  );
}
