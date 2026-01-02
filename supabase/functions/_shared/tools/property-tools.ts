/**
 * Property Tools Module
 * Property search, lookup, and location handlers.
 * 
 * @module _shared/tools/property-tools
 * @description Implements property search, lookup, and location listing.
 * 
 * @example
 * ```typescript
 * import { searchProperties, lookupProperty, getLocations } from "../_shared/tools/property-tools.ts";
 * 
 * const result = await searchProperties(supabase, agentId, { min_beds: 3 });
 * const property = await lookupProperty(supabase, agentId, conversationId, { lot_number: "42" });
 * const locations = await getLocations(supabase, agentId);
 * ```
 */

import { normalizeState } from '../utils/state-mapping.ts';

// ============================================
// TYPES
// ============================================

export interface ToolResult<T = any> {
  success: boolean;
  result?: T;
  error?: string;
}

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

export interface SearchPropertiesArgs {
  city?: string;
  state?: string;
  min_price?: number;
  max_price?: number;
  min_beds?: number;
  status?: string;
  location_id?: string;
}

export interface LookupPropertyArgs {
  address?: string;
  property_id?: string;
  lot_number?: string;
}

// ============================================
// PROPERTY SEARCH
// ============================================

/**
 * Search for available properties/homes in the database
 * 
 * @param supabase - Supabase client
 * @param agentId - Agent UUID
 * @param args - Search filters
 * @returns Search results with properties and shown_properties for context
 */
export async function searchProperties(
  supabase: any,
  agentId: string,
  args: SearchPropertiesArgs
): Promise<ToolResult> {
  try {
    let query = supabase
      .from('properties')
      .select(`
        id, address, lot_number, city, state, zip,
        price, price_type, beds, baths, sqft, status,
        description, features, listing_url,
        location_id, locations(name)
      `)
      .eq('agent_id', agentId);

    // Apply filters
    if (args.location_id) {
      query = query.eq('location_id', args.location_id);
    }
    if (args.city) {
      query = query.ilike('city', `%${args.city}%`);
    }
    if (args.state) {
      const normalizedState = normalizeState(args.state);
      console.log('State normalization:', { input: args.state, normalized: normalizedState });
      query = query.ilike('state', `%${normalizedState}%`);
    }
    if (args.min_price) {
      query = query.gte('price', args.min_price);
    }
    if (args.max_price) {
      query = query.lte('price', args.max_price);
    }
    if (args.min_beds) {
      query = query.gte('beds', args.min_beds);
    }
    if (args.status && args.status !== 'all') {
      query = query.eq('status', args.status);
    } else if (!args.status) {
      query = query.eq('status', 'available');
    }

    query = query.order('price', { ascending: true }).limit(10);

    const { data, error } = await query;

    if (error) {
      console.error('Property search error:', error);
      return { success: false, error: 'Failed to search properties' };
    }

    if (!data || data.length === 0) {
      return { 
        success: true, 
        result: { 
          properties: [], 
          message: 'No properties found matching your criteria.',
          suggestion: 'Try adjusting your search filters or ask about our other communities.'
        } 
      };
    }

    const properties = data.map((p: any, idx: number) => ({
      id: p.id,
      index: idx + 1, // 1-indexed for user-friendly referencing
      address: p.address || `Lot ${p.lot_number}`,
      city: p.city,
      state: p.state,
      price: p.price,
      // Prices are stored in cents, convert to dollars for display
      price_formatted: p.price ? `$${(p.price / 100).toLocaleString()}${p.price_type === 'rent_monthly' ? '/mo' : ''}` : 'Contact for pricing',
      beds: p.beds,
      baths: p.baths,
      sqft: p.sqft,
      status: p.status,
      community: p.locations?.name || null,
      listing_url: p.listing_url,
      location_id: p.location_id || null, // Include for direct booking
    }));

    // Create shown_properties array for conversation context memory (limit to 5)
    const shownProperties: ShownProperty[] = properties.slice(0, 5).map((p: any) => ({
      index: p.index,
      id: p.id,
      address: p.address,
      city: p.city,
      state: p.state,
      beds: p.beds,
      baths: p.baths,
      price: p.price,
      price_formatted: p.price_formatted,
      community: p.community,
      location_id: p.location_id || null, // Include for direct booking
    }));

    return { 
      success: true, 
      result: { 
        properties,
        shownProperties, // Include for metadata storage
        count: properties.length,
        message: `Found ${properties.length} ${args.status === 'all' ? '' : 'available '}properties.`
      } 
    };
  } catch (error: any) {
    console.error('searchProperties error:', error);
    return { success: false, error: error.message || 'Search failed' };
  }
}

// ============================================
// PROPERTY LOOKUP
// ============================================

/**
 * Get detailed information about a specific property by address, lot number, or ID
 * 
 * @param supabase - Supabase client
 * @param agentId - Agent UUID
 * @param conversationId - Conversation UUID for context update
 * @param args - Lookup identifiers
 * @returns Property details
 */
export async function lookupProperty(
  supabase: any,
  agentId: string,
  conversationId: string,
  args: LookupPropertyArgs
): Promise<ToolResult> {
  try {
    let query = supabase
      .from('properties')
      .select(`
        id, address, lot_number, city, state, zip,
        price, price_type, beds, baths, sqft, year_built,
        status, description, features, listing_url, images,
        updated_at,
        location_id, locations(id, name, timezone, phone, email)
      `)
      .eq('agent_id', agentId);

    if (args.property_id) {
      query = query.eq('id', args.property_id);
    } else if (args.address) {
      query = query.ilike('address', `%${args.address}%`);
    } else if (args.lot_number) {
      query = query.ilike('lot_number', `%${args.lot_number}%`);
    } else {
      return { success: false, error: 'Please provide an address, property ID, or lot number' };
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      return { 
        success: true, 
        result: { 
          found: false, 
          message: 'Property not found. Please check the address or lot number and try again.'
        } 
      };
    }

    // Update conversation with location context if property has a location
    if (data.location_id && conversationId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();
      
      if (conv) {
        await supabase
          .from('conversations')
          .update({
            location_id: data.location_id,
            metadata: {
              ...conv.metadata,
              detected_location_id: data.location_id,
              detected_location_name: data.locations?.name,
              property_context: data.address || `Lot ${data.lot_number}`,
            },
          })
          .eq('id', conversationId);
      }
    }

    // Calculate recency for status display
    const updatedAt = data.updated_at ? new Date(data.updated_at) : null;
    const daysSinceUpdate = updatedAt 
      ? Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)) 
      : null;

    // Build status message with recency context
    let statusMessage: string;
    let suggestAlternatives = false;
    
    if (data.status === 'available') {
      statusMessage = 'This home is currently available!';
    } else if (data.status === 'pending') {
      suggestAlternatives = true;
      if (daysSinceUpdate !== null && daysSinceUpdate <= 3) {
        statusMessage = daysSinceUpdate === 0
          ? 'This home just went under contract today.'
          : daysSinceUpdate === 1
            ? 'This home just went under contract yesterday.'
            : `This home went under contract ${daysSinceUpdate} days ago.`;
      } else {
        statusMessage = 'This home is pending - an offer has been accepted but not yet closed.';
      }
    } else if (data.status === 'sold') {
      suggestAlternatives = true;
      if (daysSinceUpdate !== null && daysSinceUpdate <= 7) {
        statusMessage = daysSinceUpdate === 0
          ? 'This home just sold today.'
          : daysSinceUpdate === 1
            ? 'This home just sold yesterday.'
            : `This home sold ${daysSinceUpdate} days ago.`;
      } else {
        statusMessage = 'This home has been sold.';
      }
    } else {
      suggestAlternatives = true;
      statusMessage = 'This home is no longer available.';
    }

    const property = {
      id: data.id,
      address: data.address || `Lot ${data.lot_number}`,
      full_address: [data.address, data.city, data.state, data.zip].filter(Boolean).join(', '),
      price: data.price,
      price_formatted: data.price ? `$${(data.price / 100).toLocaleString()}${data.price_type === 'rent_monthly' ? '/mo' : ''}` : 'Contact for pricing',
      beds: data.beds,
      baths: data.baths,
      sqft: data.sqft,
      year_built: data.year_built,
      status: data.status,
      status_message: statusMessage,
      suggest_alternatives: suggestAlternatives,
      description: data.description,
      features: data.features || [],
      listing_url: data.listing_url,
      community: data.locations ? {
        id: data.locations.id,
        name: data.locations.name,
        phone: data.locations.phone,
        email: data.locations.email,
      } : null,
    };

    return { success: true, result: { found: true, property } };
  } catch (error: any) {
    console.error('lookupProperty error:', error);
    return { success: false, error: error.message || 'Lookup failed' };
  }
}

// ============================================
// LOCATIONS
// ============================================

/**
 * Get list of communities/locations with contact info
 * 
 * @param supabase - Supabase client
 * @param agentId - Agent UUID
 * @returns Location list with contact details
 */
export async function getLocations(
  supabase: any,
  agentId: string
): Promise<ToolResult> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, city, state, phone, email, timezone')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Get locations error:', error);
      return { success: false, error: 'Failed to get locations' };
    }

    if (!data || data.length === 0) {
      return { 
        success: true, 
        result: { 
          locations: [], 
          message: 'No locations configured for this agent.'
        } 
      };
    }

    const locations = data.map((l: any) => ({
      id: l.id,
      name: l.name,
      city: l.city,
      state: l.state,
      full_location: [l.city, l.state].filter(Boolean).join(', '),
      phone: l.phone,
      email: l.email,
    }));

    return { 
      success: true, 
      result: { 
        locations,
        count: locations.length,
        message: `We have ${locations.length} communities. Which one are you interested in?`
      } 
    };
  } catch (error: any) {
    console.error('getLocations error:', error);
    return { success: false, error: error.message || 'Failed to get locations' };
  }
}
