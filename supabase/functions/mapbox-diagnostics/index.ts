import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiagnosticResult {
  endpoint: string;
  status: number;
  ok: boolean;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("MAPBOX_PUBLIC_TOKEN");
    
    if (!token) {
      console.error("MAPBOX_PUBLIC_TOKEN not found in secrets");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "MAPBOX_PUBLIC_TOKEN not configured",
          tokenPresent: false,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log token fingerprint (safe - only first/last chars)
    const tokenFingerprint = `${token.substring(0, 10)}...${token.substring(token.length - 6)}`;
    console.log(`Token fingerprint: ${tokenFingerprint}`);

    const results: DiagnosticResult[] = [];

    // Test 1: Style JSON (most basic - if this fails, token is invalid)
    const styleUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}`;
    try {
      const styleRes = await fetch(styleUrl);
      results.push({
        endpoint: "Style JSON (light-v11)",
        status: styleRes.status,
        ok: styleRes.ok,
        error: styleRes.ok ? undefined : await styleRes.text(),
      });
      console.log(`Style fetch: ${styleRes.status}`);
    } catch (e) {
      results.push({
        endpoint: "Style JSON (light-v11)",
        status: 0,
        ok: false,
        error: String(e),
      });
    }

    // Test 2: Tile request (this is what was returning 403 in browser)
    const tileUrl = `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/0/0/0.vector.pbf?access_token=${token}`;
    try {
      const tileRes = await fetch(tileUrl);
      results.push({
        endpoint: "Vector Tile (streets-v8)",
        status: tileRes.status,
        ok: tileRes.ok,
        error: tileRes.ok ? undefined : await tileRes.text(),
      });
      console.log(`Tile fetch: ${tileRes.status}`);
    } catch (e) {
      results.push({
        endpoint: "Vector Tile (streets-v8)",
        status: 0,
        ok: false,
        error: String(e),
      });
    }

    // Test 3: Sprite request
    const spriteUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/sprite.json?access_token=${token}`;
    try {
      const spriteRes = await fetch(spriteUrl);
      results.push({
        endpoint: "Sprite JSON",
        status: spriteRes.status,
        ok: spriteRes.ok,
        error: spriteRes.ok ? undefined : await spriteRes.text(),
      });
      console.log(`Sprite fetch: ${spriteRes.status}`);
    } catch (e) {
      results.push({
        endpoint: "Sprite JSON",
        status: 0,
        ok: false,
        error: String(e),
      });
    }

    // Determine overall diagnosis
    const allOk = results.every(r => r.ok);
    const has403 = results.some(r => r.status === 403);
    const has401 = results.some(r => r.status === 401);

    let diagnosis = "";
    if (allOk) {
      diagnosis = "Token is valid and has access to all required Mapbox resources. If browser still shows 403, the issue is likely URL origin restrictions on the token.";
    } else if (has401) {
      diagnosis = "Token is invalid or malformed. Please verify the MAPBOX_PUBLIC_TOKEN secret value.";
    } else if (has403) {
      diagnosis = "Token is recognized but access is denied (403). This typically means: (1) the token's scopes don't include tiles/styles access, or (2) your Mapbox account has billing/quota issues, or (3) the token has URL restrictions that don't match the requesting origin.";
    } else {
      diagnosis = "Unexpected error pattern. Check individual endpoint results.";
    }

    console.log(`Diagnosis: ${diagnosis}`);

    return new Response(
      JSON.stringify({
        success: allOk,
        tokenFingerprint,
        results,
        diagnosis,
        requestOrigin: req.headers.get("origin") || "unknown",
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Diagnostic error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: String(error),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
