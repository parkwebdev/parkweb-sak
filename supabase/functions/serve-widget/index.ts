import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/javascript',
  'Cache-Control': 'public, max-age=3600',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the app URL from environment or dynamically from request origin
    const referer = req.headers.get('referer');
    const appUrl = Deno.env.get('APP_URL') || 
                   (referer ? new URL(referer).origin : 'https://28cc9f18-cb6b-496b-b8a6-8c8f349e3c54.lovableproject.com');
    
    console.log('[Serve Widget] App URL:', appUrl);
    
    // Serve a loader script that loads the standalone widget bundle
    const loaderScript = `
(function() {
  console.log('[ChatPad Widget] Loading standalone widget bundle...');
  
  // Get config from script tag
  var script = document.currentScript;
  if (!script) {
    console.error('[ChatPad Widget] Failed to find script tag');
    return;
  }
  
  var agentId = script.getAttribute('data-agent-id');
  var primaryColor = script.getAttribute('data-primary-color');
  var position = script.getAttribute('data-position') || 'bottom-right';
  
  if (!agentId) {
    console.error('[ChatPad Widget] data-agent-id is required');
    return;
  }
  
  console.log('[ChatPad Widget] Agent ID:', agentId);
  console.log('[ChatPad Widget] Loading widget bundle from:', '${appUrl}/chatpad-widget.js');
  
  // Load the standalone widget bundle
  var widgetScript = document.createElement('script');
  widgetScript.src = '${appUrl}/chatpad-widget.js';
  widgetScript.setAttribute('data-agent-id', agentId);
  if (primaryColor) {
    widgetScript.setAttribute('data-primary-color', primaryColor);
  }
  widgetScript.setAttribute('data-position', position);
  
  widgetScript.onload = function() {
    console.log('[ChatPad Widget] Standalone bundle loaded successfully');
  };
  
  widgetScript.onerror = function() {
    console.error('[ChatPad Widget] Failed to load widget bundle');
  };
  
  document.head.appendChild(widgetScript);
  
  console.log('[ChatPad Widget] Widget script injected');
})();
`;

    return new Response(loaderScript, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error serving widget:', error);
    return new Response(
      `console.error('[ChatPad Widget] Server error: ${error.message}');`,
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
