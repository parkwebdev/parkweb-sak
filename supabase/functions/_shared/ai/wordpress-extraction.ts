/**
 * WordPress AI Extraction Utility
 * 
 * Uses Gemini 2.5 Flash to extract structured data from WordPress posts
 * when standard ACF mapping fails or is insufficient.
 * 
 * @module _shared/ai/wordpress-extraction
 */

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');

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
 * Call Gemini API with structured output
 */
async function callGemini<T>(
  systemPrompt: string,
  userContent: string,
  schema: Record<string, unknown>
): Promise<T | null> {
  if (!GOOGLE_API_KEY) {
    console.error('No Google API key configured for AI extraction');
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userContent}` }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('No text in Gemini response');
      return null;
    }

    return JSON.parse(text) as T;
  } catch (error: unknown) {
    console.error('Error calling Gemini for extraction:', error);
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

Be accurate and only extract information that is clearly stated.`;

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      address: { type: ['string', 'null'] },
      city: { type: ['string', 'null'] },
      state: { type: ['string', 'null'] },
      zip: { type: ['string', 'null'] },
      phone: { type: ['string', 'null'] },
      email: { type: ['string', 'null'] },
      description: { type: ['string', 'null'] },
      amenities: { type: 'array', items: { type: 'string' } },
      pet_policy: { type: ['string', 'null'] },
      office_hours: { type: ['string', 'null'] },
      latitude: { type: ['number', 'null'] },
      longitude: { type: ['number', 'null'] },
    },
    required: ['name'],
  };

  const result = await callGemini<ExtractedCommunityData>(
    systemPrompt,
    context,
    schema
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

Be accurate and only extract information that is clearly stated. For price, extract the numeric value only.`;

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      address: { type: ['string', 'null'] },
      lot_number: { type: ['string', 'null'] },
      city: { type: ['string', 'null'] },
      state: { type: ['string', 'null'] },
      zip: { type: ['string', 'null'] },
      price: { type: ['number', 'null'] },
      price_type: { type: ['string', 'null'], enum: ['sale', 'rent', 'lease', null] },
      beds: { type: ['number', 'null'] },
      baths: { type: ['number', 'null'] },
      sqft: { type: ['number', 'null'] },
      year_built: { type: ['number', 'null'] },
      status: { type: ['string', 'null'], enum: ['available', 'pending', 'sold', 'rented', 'off_market', null] },
      description: { type: ['string', 'null'] },
      features: { type: 'array', items: { type: 'string' } },
    },
    required: ['name'],
  };

  const result = await callGemini<ExtractedPropertyData>(
    systemPrompt,
    context,
    schema
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
