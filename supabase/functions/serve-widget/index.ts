import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/javascript',
  'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
};

// Read the widget.js file content
const widgetContent = await Deno.readTextFile('./public/widget.js');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Serve the widget.js file
    return new Response(widgetContent, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error serving widget:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to serve widget' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
