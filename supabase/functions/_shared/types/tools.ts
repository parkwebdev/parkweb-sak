/**
 * Tool Type Definitions
 * Shared types for tool execution and results.
 * 
 * @module _shared/types/tools
 */

// ============================================
// TOOL RESULT TYPES
// ============================================

/**
 * Generic tool execution result.
 * Use for consistent tool return types.
 */
export interface ToolResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: string;
}

// ============================================
// BOOKING TYPES
// ============================================

/**
 * Available time slot for booking.
 */
export interface AvailableSlot {
  start: string;
  end: string;
}

/**
 * Location information for bookings.
 */
export interface BookingLocation {
  id: string;
  name: string;
  timezone: string;
}

/**
 * Booking confirmation details.
 */
export interface BookingConfirmation {
  id: string;
  start_time: string;
  end_time: string;
  location_name: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
}

/**
 * Result from booking tool execution.
 */
export interface BookingToolResult {
  available_slots?: AvailableSlot[];
  location?: BookingLocation;
  booking?: BookingConfirmation;
}

// ============================================
// PROPERTY TYPES
// ============================================

/**
 * Property row from database query.
 * Matches the properties table schema.
 */
export interface PropertyRow {
  id: string;
  external_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  price: number | null;
  price_type: 'sale' | 'rent_monthly' | 'rent_weekly' | null;
  status: 'available' | 'pending' | 'sold' | 'rented' | 'coming_soon' | null;
  description: string | null;
  features: string[] | null;
  images: unknown | null;
  listing_url: string | null;
  location_id: string | null;
  lot_number: string | null;
  year_built: number | null;
}

/**
 * Shown property for chat context.
 * Matches ConversationMetadata.shown_properties structure.
 */
export interface ShownProperty {
  index: number;
  id: string;
  address: string;
  city: string;
  state: string;
  beds: number | null;
  baths: number | null;
  price: number | null;
  price_formatted: string;
  community: string | null;
  location_id: string | null;
}

// ============================================
// CALENDAR TYPES
// ============================================

/**
 * Calendar event from database.
 */
export interface CalendarEventRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean | null;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show' | null;
  location_id: string | null;
  connected_account_id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  notes: string | null;
  metadata: unknown | null;
}

// ============================================
// WEBHOOK TYPES
// ============================================

/**
 * Event payload for webhook dispatch.
 */
export interface EventPayload {
  type: 'insert' | 'update' | 'delete';
  table: string;
  schema: string;
  record: Record<string, unknown>;
  old_record?: Record<string, unknown> | null;
}
