import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint_url, headers, timeout_ms, sample_data } = await req.json();

    if (!endpoint_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing endpoint_url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testing tool endpoint: ${endpoint_url}`);

    const startTime = Date.now();
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout_ms || 10000);

    try {
      const response = await fetch(endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(headers || {}),
        },
        body: JSON.stringify(sample_data || {}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let responseBody: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      console.log(`Tool test completed: ${response.status} in ${responseTime}ms`);

      return new Response(
        JSON.stringify({
          success: true,
          status: response.status,
          statusText: response.statusText,
          responseTime,
          contentType,
          body: responseBody,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Request timed out after ${timeout_ms || 10000}ms`,
            responseTime,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: fetchError.message || 'Failed to reach endpoint',
          responseTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in test-tool-endpoint:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});