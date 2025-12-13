/**
 * Location Type Definitions
 * 
 * Types for multi-location business management.
 * Locations represent communities, properties, or business sites.
 * 
 * @module types/locations
 */

import type { Tables } from '@/integrations/supabase/types';

/**
 * Location from database
 */
export type Location = Tables<'locations'>;

/**
 * Business hours for a single day
 */
export interface DayHours {
  /** Whether the business is open on this day */
  isOpen: boolean;
  /** Opening time in 24h format (e.g., "09:00") */
  open?: string;
  /** Closing time in 24h format (e.g., "17:00") */
  close?: string;
}

/**
 * Weekly business hours configuration
 */
export interface BusinessHours {
  monday?: DayHours;
  tuesday?: DayHours;
  wednesday?: DayHours;
  thursday?: DayHours;
  friday?: DayHours;
  saturday?: DayHours;
  sunday?: DayHours;
}

/**
 * Location metadata stored in JSONB
 */
export interface LocationMetadata {
  /** Custom fields for this location */
  custom_fields?: Record<string, string | number | boolean>;
  /** Notes about this location */
  notes?: string;
  /** External CRM/system ID */
  external_id?: string;
}

/**
 * Form data for creating/editing locations
 */
export interface LocationFormData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  timezone?: string;
  phone?: string;
  email?: string;
  business_hours?: BusinessHours;
  url_patterns?: string[];
}

/**
 * US Timezones for dropdown
 */
export const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
] as const;
