/**
 * WordPress AI Extraction Utility
 * 
 * Uses Claude Haiku 4.5 via OpenRouter to extract structured data from WordPress posts
 * when standard ACF mapping fails or is insufficient.
 * 
 * @module _shared/ai/wordpress-extraction
 */

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const EXTRACTION_MODEL = 'anthropic/claude-haiku-4.5';

// ============================================
// INTERFACES
// ============================================

export interface ExtractedCommunityData {
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  amenities?: string[];
  pet_policy?: string | null;
  office_hours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // New fields for enhanced community data
  age_category?: string | null;
  utilities_included?: { water?: boolean; trash?: boolean; electric?: boolean } | null;
}

export interface ExtractedPropertyData {
  name: string;
  address?: string | null;
  lot_number?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | null;
  price_type?: 'sale' | 'rent' | 'lease' | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  year_built?: number | null;
  status?: 'available' | 'pending' | 'sold' | 'rented' | 'off_market' | null;
  description?: string | null;
  features?: string[];
  // New fields for enhanced property data
  manufacturer?: string | null;
  model?: string | null;
  lot_rent?: number | null;  // in dollars (convert to cents after)
  virtual_tour_url?: string | null;
  community_type?: string | null;
}

interface WordPressPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content?: { rendered: string };
  excerpt?: { rendered: string };
  acf?: Record<string, unknown>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build context string from WordPress post data
 */
function buildPostContext(post: WordPressPost): string {
  const parts: string[] = [];
  
  // Title
  parts.push(`Title: ${stripHtml(post.title.rendered)}`);
  
  // Content
  if (post.content?.rendered) {
    const content = stripHtml(post.content.rendered);
    if (content.length > 0) {
      parts.push(`Content: ${content.substring(0, 3000)}`);
    }
  }
  
  // Excerpt
  if (post.excerpt?.rendered) {
    const excerpt = stripHtml(post.excerpt.rendered);
    if (excerpt.length > 0) {
      parts.push(`Excerpt: ${excerpt}`);
    }
  }
  
  // ACF fields
  if (post.acf && Object.keys(post.acf).length > 0) {
    const acfStr = JSON.stringify(post.acf, null, 2);
    parts.push(`ACF Custom Fields: ${acfStr.substring(0, 2000)}`);
  }
  
  return parts.join('\n\n');
}

/**
 * Call Claude via OpenRouter with tool calling for structured output
 */
async function callClaude<T>(
  systemPrompt: string,
  userContent: string,
  toolSchema: Record<string, unknown>,
  toolName: string
): Promise<T | null> {
  if (!OPENROUTER_API_KEY) {
    console.error('No OpenRouter API key configured for AI extraction');
    return null;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EXTRACTION_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        tools: [{
          type: 'function',
          function: {
            name: toolName,
            description: `Extract structured ${toolName.replace('_', ' ')} data from the provided content`,
            parameters: toolSchema,
          },
        }],
        tool_choice: { type: 'function', function: { name: toolName } },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error('No tool call in Claude response');
      return null;
    }

    return JSON.parse(toolCall.function.arguments) as T;
  } catch (error: unknown) {
    console.error('Error calling Claude for extraction:', error);
    return null;
  }
}

// ============================================
// EXTRACTION FUNCTIONS
// ============================================

/**
 * Extract community/location data from a WordPress post using AI
 */
export async function extractCommunityData(
  post: WordPressPost
): Promise<ExtractedCommunityData | null> {
  const context = buildPostContext(post);
  
  const systemPrompt = `You are a data extraction assistant. Extract structured community/location data from the provided WordPress post content.

A community is typically a residential community, mobile home park, apartment complex, or similar location.

Extract the following fields if present. Return null for fields that cannot be determined:
- name: The community name (required)
- address: Street address
- city: City name
- state: State (2-letter abbreviation preferred)
- zip: ZIP/postal code
- phone: Contact phone number
- email: Contact email
- description: Brief description of the community
- amenities: List of amenities (pool, clubhouse, fitness center, etc.)
- pet_policy: Pet policy details
- office_hours: Office hours if mentioned
- latitude: GPS latitude if available
- longitude: GPS longitude if available
- age_category: Type of community (55+, All Ages, Family, Senior, etc.)
- utilities_included: Which utilities are included (water, trash, electric)

Be accurate and only extract information that is clearly stated.`;

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'The community name' },
      address: { type: 'string', description: 'Street address' },
      city: { type: 'string', description: 'City name' },
      state: { type: 'string', description: 'State (2-letter abbreviation preferred)' },
      zip: { type: 'string', description: 'ZIP/postal code' },
      phone: { type: 'string', description: 'Contact phone number' },
      email: { type: 'string', description: 'Contact email' },
      description: { type: 'string', description: 'Brief description of the community' },
      amenities: { type: 'array', items: { type: 'string' }, description: 'List of amenities' },
      pet_policy: { type: 'string', description: 'Pet policy details' },
      office_hours: { type: 'string', description: 'Office hours' },
      latitude: { type: 'number', description: 'GPS latitude' },
      longitude: { type: 'number', description: 'GPS longitude' },
      age_category: { type: 'string', description: 'Community age restriction (55+, All Ages, Family, Senior, etc.)' },
      utilities_included: { 
        type: 'object', 
        properties: {
          water: { type: 'boolean', description: 'Water included in lot rent' },
          trash: { type: 'boolean', description: 'Trash included in lot rent' },
          electric: { type: 'boolean', description: 'Electric included in lot rent' },
        },
        description: 'Which utilities are included in lot rent' 
      },
    },
    required: ['name'],
  };

  const result = await callClaude<ExtractedCommunityData>(
    systemPrompt,
    context,
    schema,
    'extract_community'
  );
  
  if (result) {
    console.log(`✨ AI extracted community data for: ${result.name}`);
  }
  
  return result;
}

/**
 * Extract property/home data from a WordPress post using AI
 */
export async function extractPropertyData(
  post: WordPressPost
): Promise<ExtractedPropertyData | null> {
  const context = buildPostContext(post);
  
  const systemPrompt = `You are a data extraction assistant. Extract structured property/home listing data from the provided WordPress post content.

A property is typically a home, manufactured home, mobile home, apartment, or similar real estate listing.

Extract the following fields if present. Return null for fields that cannot be determined:
- name: Property name or title (required)
- address: Street address
- lot_number: Lot, unit, or site number
- city: City name
- state: State (2-letter abbreviation preferred)
- zip: ZIP/postal code
- price: Price in dollars (numeric, no currency symbols)
- price_type: One of "sale", "rent", or "lease"
- beds: Number of bedrooms (numeric)
- baths: Number of bathrooms (numeric, can be decimal like 1.5)
- sqft: Square footage (numeric)
- year_built: Year built (4-digit year)
- status: One of "available", "pending", "sold", "rented", or "off_market"
- description: Brief property description
- features: List of features/amenities
- manufacturer: Home manufacturer/builder name (e.g., "Clayton", "Champion", "Skyline")
- model: Home model name (e.g., "The Breeze", "Northwind")
- lot_rent: Monthly lot/site rent in dollars (numeric)
- virtual_tour_url: Link to virtual tour, 3D walkthrough, or video tour
- community_type: Type of community (e.g., "55+", "All Ages", "Family", "Senior")

Be accurate and only extract information that is clearly stated. For price and lot_rent, extract numeric values only.`;

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Property name or title' },
      address: { type: 'string', description: 'Street address' },
      lot_number: { type: 'string', description: 'Lot, unit, or site number' },
      city: { type: 'string', description: 'City name' },
      state: { type: 'string', description: 'State (2-letter abbreviation preferred)' },
      zip: { type: 'string', description: 'ZIP/postal code' },
      price: { type: 'number', description: 'Price in dollars' },
      price_type: { type: 'string', enum: ['sale', 'rent', 'lease'], description: 'Type of price' },
      beds: { type: 'number', description: 'Number of bedrooms' },
      baths: { type: 'number', description: 'Number of bathrooms' },
      sqft: { type: 'number', description: 'Square footage' },
      year_built: { type: 'number', description: 'Year built' },
      status: { type: 'string', enum: ['available', 'pending', 'sold', 'rented', 'off_market'], description: 'Listing status' },
      description: { type: 'string', description: 'Brief property description' },
      features: { type: 'array', items: { type: 'string' }, description: 'List of features/amenities' },
      manufacturer: { type: 'string', description: 'Home manufacturer/builder name' },
      model: { type: 'string', description: 'Home model name' },
      lot_rent: { type: 'number', description: 'Monthly lot/site rent in dollars' },
      virtual_tour_url: { type: 'string', description: 'Link to virtual tour or video' },
      community_type: { type: 'string', description: 'Type of community (55+, All Ages, etc.)' },
    },
    required: ['name'],
  };

  const result = await callClaude<ExtractedPropertyData>(
    systemPrompt,
    context,
    schema,
    'extract_property'
  );
  
  if (result) {
    console.log(`✨ AI extracted property data for: ${result.name}`);
  }
  
  return result;
}

/**
 * Merge AI-extracted data with existing ACF data, preferring ACF when both exist
 */
export function mergeWithAcfData<T extends Record<string, unknown>>(
  acfData: T,
  aiData: T | null
): T {
  if (!aiData) return acfData;
  
  const merged = { ...acfData };
  
  for (const [key, value] of Object.entries(aiData)) {
    // Only use AI value if ACF doesn't have a value for this field
    if (merged[key] === null || merged[key] === undefined || merged[key] === '') {
      (merged as Record<string, unknown>)[key] = value;
    }
  }
  
  return merged;
}
