import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/javascript',
  'Cache-Control': 'public, max-age=3600',
};

// Dynamically import the widget content
let widgetContent: string;

try {
  widgetContent = await Deno.readTextFile(new URL('./chatpad-widget.min.js', import.meta.url));
} catch (error) {
  console.error('Error reading widget file:', error);
  widgetContent = `console.error('Widget failed to load');`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
