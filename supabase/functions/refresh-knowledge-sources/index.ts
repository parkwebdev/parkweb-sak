/**
 * Refresh Knowledge Sources Edge Function
 * 
 * Cron-triggered function that refreshes knowledge sources based on their refresh strategy.
 * Implements hash-based change detection to skip re-embedding unchanged content.
 * For property_listings sources, extracts properties via AI and syncs to properties table.
 * Hard deletes removed properties/sources for cost efficiency.
 * 
 * @module functions/refresh-knowledge-sources
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Refresh strategy to hours mapping
const REFRESH_HOURS: Record<string, number> = {
  hourly_1: 1,
  hourly_2: 2,
  hourly_3: 3,
  hourly_4: 4,
  hourly_6: 6,
  hourly_12: 12,
  daily: 24,
};

/**
 * Calculate SHA-256 hash of content
 */
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Calculate next refresh timestamp based on strategy
 */
function calculateNextRefresh(strategy: string): string {
  const hours = REFRESH_HOURS[strategy];
  if (!hours) {
    // Default to 24 hours if unknown strategy
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/**
 * Fetch and parse content from URL using Readability-like extraction
 */
async function fetchUrlContent(url: string): Promise<{ content: string; title: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Pilot-Bot/1.0 (Content Refresh)",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // Simple content extraction - remove scripts, styles, and extract text
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    return { content, title };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Extract properties from content using AI
 */
async function extractPropertiesWithAI(
  content: string,
  sourceUrl: string
): Promise<ExtractedProperty[]> {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  if (!OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY not configured");
    return [];
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://getpilot.io",
        "X-Title": "Pilot Property Extraction",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a property listing extraction expert. Extract all property listings from the provided content.
For each property, extract:
- external_id: A unique identifier (lot number, listing ID, or generate from address)
- address: Street address
- lot_number: Lot or unit number if applicable
- city, state, zip: Location details
- status: One of "available", "pending", "sold", "rented", "coming_soon"
- price: Price in cents (e.g., 850 dollars = 85000)
- price_type: One of "sale", "rent_monthly", "rent_weekly"
- beds: Number of bedrooms (integer)
- baths: Number of bathrooms (decimal)
- sqft: Square footage (integer)
- year_built: Year (integer)
- description: Property description
- features: Array of feature strings
- listing_url: Direct link to this property if available

Return ONLY a JSON array of properties. If no properties found, return [].`,
          },
          {
            role: "user",
            content: `Extract all property listings from this content. Source URL: ${sourceUrl}\n\n${content.substring(0, 50000)}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_properties",
              description: "Extract property listings from content",
              parameters: {
                type: "object",
                properties: {
                  properties: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        external_id: { type: "string" },
                        address: { type: "string" },
                        lot_number: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        zip: { type: "string" },
                        status: { type: "string", enum: ["available", "pending", "sold", "rented", "coming_soon"] },
                        price: { type: "number" },
                        price_type: { type: "string", enum: ["sale", "rent_monthly", "rent_weekly"] },
                        beds: { type: "number" },
                        baths: { type: "number" },
                        sqft: { type: "number" },
                        year_built: { type: "number" },
                        description: { type: "string" },
                        features: { type: "array", items: { type: "string" } },
                        listing_url: { type: "string" },
                      },
                      required: ["external_id"],
                    },
                  },
                },
                required: ["properties"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_properties" } },
      }),
    });

    if (!response.ok) {
      console.error(`AI extraction failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return parsed.properties || [];
    }

    return [];
  } catch (error) {
    console.error("Error extracting properties:", error);
    return [];
  }
}

interface ExtractedProperty {
  external_id: string;
  address?: string;
  lot_number?: string;
  city?: string;
  state?: string;
  zip?: string;
  status?: string;
  price?: number;
  price_type?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  year_built?: number;
  description?: string;
  features?: string[];
  listing_url?: string;
}

/**
 * Sync extracted properties to database (upsert new, delete removed)
 */
async function syncProperties(
  supabase: ReturnType<typeof createClient>,
  sourceId: string,
  locationId: string | null,
  agentId: string,
  extractedProperties: ExtractedProperty[]
): Promise<{ added: number; updated: number; deleted: number }> {
  const result = { added: 0, updated: 0, deleted: 0 };

  try {
    // Get existing properties for this source
    const { data: existingProperties, error: fetchError } = await supabase
      .from("properties")
      .select("id, external_id")
      .eq("knowledge_source_id", sourceId);

    if (fetchError) throw fetchError;

    const existingMap = new Map(
      (existingProperties || []).map((p) => [p.external_id, p.id])
    );
    const extractedIds = new Set(extractedProperties.map((p) => p.external_id));

    // Delete properties no longer in source (HARD DELETE for cost savings)
    const toDelete = (existingProperties || [])
      .filter((p) => !extractedIds.has(p.external_id))
      .map((p) => p.id);

    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("properties")
        .delete()
        .in("id", toDelete);

      if (deleteError) {
        console.error("Error deleting removed properties:", deleteError);
      } else {
        result.deleted = toDelete.length;
        console.log(`Deleted ${toDelete.length} removed properties`);
      }
    }

    // Upsert extracted properties
    for (const prop of extractedProperties) {
      const existingId = existingMap.get(prop.external_id);
      const now = new Date().toISOString();

      const propertyData = {
        knowledge_source_id: sourceId,
        location_id: locationId,
        agent_id: agentId,
        external_id: prop.external_id,
        address: prop.address,
        lot_number: prop.lot_number,
        city: prop.city,
        state: prop.state,
        zip: prop.zip,
        status: prop.status || "available",
        price: prop.price,
        price_type: prop.price_type || "rent_monthly",
        beds: prop.beds,
        baths: prop.baths,
        sqft: prop.sqft,
        year_built: prop.year_built,
        description: prop.description,
        features: prop.features || [],
        images: [],
        listing_url: prop.listing_url,
        last_seen_at: now,
      };

      if (existingId) {
        // Update existing
        const { error: updateError } = await supabase
          .from("properties")
          .update(propertyData)
          .eq("id", existingId);

        if (updateError) {
          console.error(`Error updating property ${prop.external_id}:`, updateError);
        } else {
          result.updated++;
        }
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from("properties")
          .insert({
            ...propertyData,
            first_seen_at: now,
          });

        if (insertError) {
          console.error(`Error inserting property ${prop.external_id}:`, insertError);
        } else {
          result.added++;
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error syncing properties:", error);
    return result;
  }
}

/**
 * Process a single knowledge source refresh
 */
async function processSourceRefresh(
  supabase: ReturnType<typeof createClient>,
  source: {
    id: string;
    source: string;
    source_type: string;
    content_hash: string | null;
    agent_id: string;
    default_location_id: string | null;
    metadata: Record<string, unknown>;
  }
): Promise<{ changed: boolean; error?: string }> {
  console.log(`Processing refresh for source: ${source.id} (${source.source})`);

  // Fetch current content
  const fetchResult = await fetchUrlContent(source.source);
  if (!fetchResult) {
    return { changed: false, error: "Failed to fetch content" };
  }

  // Calculate content hash
  const newHash = await hashContent(fetchResult.content);

  // Check if content changed
  if (source.content_hash === newHash) {
    console.log(`Content unchanged for source ${source.id}`);
    return { changed: false };
  }

  console.log(`Content changed for source ${source.id}, processing...`);

  // Handle property_listings type - extract and sync properties
  if (source.source_type === "property_listings") {
    const extractedProperties = await extractPropertiesWithAI(
      fetchResult.content,
      source.source
    );

    if (extractedProperties.length > 0) {
      const syncResult = await syncProperties(
        supabase,
        source.id,
        source.default_location_id,
        source.agent_id,
        extractedProperties
      );

      console.log(
        `Property sync: ${syncResult.added} added, ${syncResult.updated} updated, ${syncResult.deleted} deleted`
      );
    }
  }

  // For all types, update the content and trigger re-embedding
  // Update content in knowledge_source
  const { error: updateError } = await supabase
    .from("knowledge_sources")
    .update({
      content: fetchResult.content,
      content_hash: newHash,
      status: "processing",
    })
    .eq("id", source.id);

  if (updateError) {
    console.error(`Error updating source ${source.id}:`, updateError);
    return { changed: true, error: updateError.message };
  }

  // Trigger re-processing via process-knowledge-source function
  const { error: invokeError } = await supabase.functions.invoke(
    "process-knowledge-source",
    {
      body: { sourceId: source.id, agentId: source.agent_id },
    }
  );

  if (invokeError) {
    console.error(`Error invoking process-knowledge-source:`, invokeError);
  }

  return { changed: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for manual single-source refresh request
    let body: { sourceId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - that's fine for cron calls
    }

    let sourcesToRefresh: Array<{
      id: string;
      source: string;
      source_type: string;
      content_hash: string | null;
      agent_id: string;
      default_location_id: string | null;
      metadata: Record<string, unknown>;
      refresh_strategy: string;
    }> = [];

    if (body.sourceId) {
      // Manual refresh of a specific source
      console.log(`Manual refresh requested for source: ${body.sourceId}`);
      
      const { data, error } = await supabase
        .from("knowledge_sources")
        .select("id, source, source_type, content_hash, agent_id, default_location_id, metadata, refresh_strategy")
        .eq("id", body.sourceId)
        .single();

      if (error) {
        throw new Error(`Source not found: ${error.message}`);
      }

      sourcesToRefresh = [data as typeof sourcesToRefresh[0]];
    } else {
      // Cron-triggered batch refresh
      console.log("Starting scheduled knowledge source refresh job...");
      
      const { data, error: queryError } = await supabase
        .from("knowledge_sources")
        .select("id, source, source_type, content_hash, agent_id, default_location_id, metadata, refresh_strategy")
        .neq("refresh_strategy", "manual")
        .or(`next_refresh_at.is.null,next_refresh_at.lte.${new Date().toISOString()}`)
        .limit(10);

      if (queryError) {
        throw queryError;
      }

      sourcesToRefresh = (data || []) as typeof sourcesToRefresh;
    }

    console.log(`Processing ${sourcesToRefresh.length} sources`);

    const results = {
      processed: 0,
      changed: 0,
      unchanged: 0,
      errors: 0,
    };

    for (const source of sourcesToRefresh) {
      try {
        const result = await processSourceRefresh(supabase, source);

        results.processed++;
        if (result.error) {
          results.errors++;
        } else if (result.changed) {
          results.changed++;
        } else {
          results.unchanged++;
        }

        // Update next_refresh_at and last_fetched_at
        await supabase
          .from("knowledge_sources")
          .update({
            last_fetched_at: new Date().toISOString(),
            next_refresh_at: calculateNextRefresh(source.refresh_strategy),
          })
          .eq("id", source.id);
      } catch (error) {
        console.error(`Error processing source ${source.id}:`, error);
        results.errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Refresh job completed in ${duration}ms:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        duration,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Refresh job error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
