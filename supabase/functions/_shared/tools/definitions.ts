/**
 * Tool Definitions
 * Built-in tool definitions for AI function calling.
 * 
 * @module _shared/tools/definitions
 * @description Defines BOOKING_TOOLS array with search, lookup, calendar tools.
 * 
 * @example
 * ```typescript
 * import { BOOKING_TOOLS } from "../_shared/tools/definitions.ts";
 * 
 * const aiRequest = {
 *   model: "google/gemini-2.5-flash",
 *   messages: [...],
 *   tools: BOOKING_TOOLS,
 * };
 * ```
 */

// ============================================
// BOOKING TOOLS DEFINITIONS
// ============================================

/**
 * Built-in tools for property search, calendar, and booking functionality.
 * Each tool includes detailed descriptions with triggers, examples, and workflow guidance.
 */
export const BOOKING_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_properties',
      description: `Search for available properties/homes in the database.

TRIGGERS - Use this tool when user:
• Asks about available homes, units, properties, rentals, or listings
• Says "what do you have", "show me homes", "looking for a place"
• Mentions price range, bedrooms, location preferences
• Asks "what's available in [city/community]"
• Wants to browse or see options

EXAMPLES:
• "Do you have any 3-bedroom homes?" → search_properties(min_beds: 3)
• "What's available under $1500?" → search_properties(max_price: 150000)
• "Show me homes in Clearview" → search_properties(city: "Clearview") or use location_id

WORKFLOW:
• This is typically the FIRST tool in the property journey
• AFTER: User may ask about a specific property → use lookup_property
• AFTER: User may want to schedule a tour → use check_calendar_availability

DO NOT USE when:
• User asks about a SPECIFIC property they already mentioned (use lookup_property)
• User asks for contact info only (use get_locations)
• User is ready to book (use book_appointment)`,
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City to search in' },
          state: { type: 'string', description: 'State to search in' },
          min_price: { type: 'number', description: 'Minimum price' },
          max_price: { type: 'number', description: 'Maximum price' },
          min_beds: { type: 'integer', description: 'Minimum bedrooms' },
          status: { 
            type: 'string', 
            enum: ['available', 'pending', 'all'],
            description: 'Property status filter (default: available)'
          },
          location_id: { type: 'string', description: 'Specific location/community ID to search in' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'lookup_property',
      description: `Get detailed information about a SPECIFIC property by address, lot number, or ID.

TRIGGERS - Use this tool when user:
• References a specific property from search results ("tell me more about the first one")
• Uses ordinal references ("the second home", "the cheapest one", "that $1200 one")
• Asks about a specific address or lot number they know
• Says "more details", "tell me about", "what about" a specific home
• Wants full description, features, or photos of ONE property

EXAMPLES:
• "Tell me more about lot 42" → lookup_property(lot_number: "42")
• "What about the first one?" → lookup_property(property_id: [id from previous search])
• "Details on 123 Oak Street" → lookup_property(address: "123 Oak Street")

WORKFLOW:
• BEFORE: User typically did search_properties first
• AFTER: User may want to schedule a tour → use check_calendar_availability

DO NOT USE when:
• User wants to browse multiple properties (use search_properties)
• User hasn't specified WHICH property they mean
• User asks about communities, not specific homes (use get_locations)`,
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Property address to look up' },
          property_id: { type: 'string', description: 'Property ID' },
          lot_number: { type: 'string', description: 'Lot number' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_locations',
      description: `Get list of communities/locations with CONTACT INFO (phone numbers, emails, addresses, business hours).

TRIGGERS - Use this tool when user:
• Asks for phone number, email, or contact info for a community
• Says "how do I reach", "call", "contact", "phone number for"
• Asks about office hours or location addresses
• Needs to choose between communities ("which locations do you have")
• Asks "where are you located" or about community names

EXAMPLES:
• "What's the phone for Clearview Estates?" → get_locations, find Clearview, provide phone
• "How do I contact your office?" → get_locations, provide relevant contact
• "What communities do you have?" → get_locations, list all

WORKFLOW:
• Can be used ANYTIME - standalone for contact info
• BEFORE search_properties: To help user pick a community to search in
• Provides location_id needed for check_calendar_availability and book_appointment

DO NOT USE when:
• User asks about specific properties (use search_properties or lookup_property)
• User is already discussing a specific community you know the ID for

CRITICAL: You have phone numbers - NEVER tell users to "check the website" for contact info!`,
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_calendar_availability',
      description: `Check available appointment times for property tours, viewings, or visits.

TRIGGERS - Use this tool when user:
• Wants to schedule, book, or arrange a tour/visit
• Says "when can I come by", "schedule a viewing", "book a tour"
• Asks "what times are available", "when are you open for tours"
• Mentions specific dates they're interested in visiting
• Says "I'd like to see it", "can I visit"

EXAMPLES:
• "Can I schedule a tour?" → check_calendar_availability(location_id, date_from: today)
• "What's available this weekend?" → check_calendar_availability with weekend dates
• "I'd like to visit Clearview on Friday" → get location_id first, then check availability

WORKFLOW:
• BEFORE: Get location_id from get_locations if not known
• BEFORE: User may have searched/viewed properties first
• AFTER: User selects a time → use book_appointment to confirm

DO NOT USE when:
• User is just browsing properties (use search_properties)
• User already selected a time and wants to confirm (use book_appointment)
• You don't have a location_id yet (use get_locations first)`,
      parameters: {
        type: 'object',
        properties: {
          location_id: { type: 'string', description: 'Location ID for the appointment' },
          date_from: { type: 'string', description: 'Start date to check (YYYY-MM-DD format)' },
          date_to: { type: 'string', description: 'End date to check (YYYY-MM-DD format)' },
          duration_minutes: { type: 'integer', description: 'Appointment duration in minutes (default: 30)' }
        },
        required: ['location_id']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'book_appointment',
      description: `Book/confirm a tour or appointment. This is the FINAL step after user selects a time.

TRIGGERS - Use this tool when user:
• Confirms a specific time slot ("yes, book me for 2pm", "that works")
• Says "confirm", "book it", "schedule me", "I'll take that slot"
• Provides their name/contact info for the booking
• Explicitly agrees to a proposed appointment time

EXAMPLES:
• User: "Yes, book me for 2pm on Friday" → book_appointment with that time
• User: "That 10am slot works" → book_appointment with the slot they referenced

WORKFLOW:
• BEFORE: MUST have used check_calendar_availability to show available times
• BEFORE: User MUST have selected/confirmed a specific time
• This is the END of the booking flow

DO NOT USE when:
• User is still browsing times (use check_calendar_availability)
• User hasn't confirmed a specific slot yet
• You don't have visitor_name (ask for it first)
• User is asking about availability, not confirming

REQUIRED: location_id, start_time, visitor_name - collect these before booking!`,
      parameters: {
        type: 'object',
        properties: {
          location_id: { type: 'string', description: 'Location ID' },
          start_time: { type: 'string', description: 'Appointment start time (ISO 8601 format)' },
          end_time: { type: 'string', description: 'Appointment end time (ISO 8601 format, optional)' },
          duration_minutes: { type: 'integer', description: 'Appointment duration if end_time not provided (default: 30)' },
          visitor_name: { type: 'string', description: 'Visitor full name' },
          visitor_email: { type: 'string', description: 'Visitor email address' },
          visitor_phone: { type: 'string', description: 'Visitor phone number' },
          property_address: { type: 'string', description: 'Specific property address to view (if applicable)' },
          notes: { type: 'string', description: 'Additional notes or special requests' }
        },
        required: ['location_id', 'start_time', 'visitor_name']
      }
    }
  }
];

/**
 * Get tool definition by name
 * 
 * @param name - Tool function name
 * @returns Tool definition or undefined
 */
export function getToolDefinition(name: string) {
  return BOOKING_TOOLS.find(t => t.function.name === name);
}

/**
 * Get all tool names
 * 
 * @returns Array of tool function names
 */
export function getToolNames(): string[] {
  return BOOKING_TOOLS.map(t => t.function.name);
}
