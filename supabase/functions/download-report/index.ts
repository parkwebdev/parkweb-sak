/**
 * Download Report Edge Function
 * 
 * Proxies report downloads by looking up the export record and generating
 * a fresh signed URL. This avoids Cloudflare Worker routing issues with
 * direct storage URLs.
 * 
 * GET /download-report?exportId={uuid}
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { getErrorMessage } from '../_shared/errors.ts';

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const exportId = url.searchParams.get("exportId");

    // Validate exportId
    if (!exportId) {
      console.log("[download-report] Missing exportId parameter");
      return new Response(
        JSON.stringify({ error: "Missing exportId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!UUID_REGEX.test(exportId)) {
      console.log("[download-report] Invalid exportId format:", exportId);
      return new Response(
        JSON.stringify({ error: "Invalid exportId format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[download-report] Looking up export: ${exportId}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the export record
    const { data: exportRecord, error: lookupError } = await supabase
      .from("report_exports")
      .select("file_path, format, name")
      .eq("id", exportId)
      .single();

    if (lookupError || !exportRecord) {
      console.log("[download-report] Export not found:", exportId, lookupError?.message);
      return new Response(
        JSON.stringify({ error: "Report not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[download-report] Found export: ${exportRecord.name}, path: ${exportRecord.file_path}`);

    // Generate a fresh signed URL (1 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("report-exports")
      .createSignedUrl(exportRecord.file_path, 60 * 60); // 1 hour

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("[download-report] Error creating signed URL:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Failed to generate download URL" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[download-report] Redirecting to signed URL for: ${exportRecord.name}`);

    // Redirect to the signed URL
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": signedUrlData.signedUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error: unknown) {
    console.error("[download-report] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
