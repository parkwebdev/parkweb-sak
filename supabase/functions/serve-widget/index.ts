import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/javascript',
  'Cache-Control': 'public, max-age=3600',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Determine the app URL dynamically
    let appUrl = Deno.env.get('APP_URL') || '';
    
    // If no APP_URL, try to get from referer or use production URL
    if (!appUrl) {
      const referer = req.headers.get('referer');
      if (referer) {
        const url = new URL(referer);
        appUrl = `${url.protocol}//${url.host}`;
      } else {
        // Default to Supabase project URL
        appUrl = 'https://mvaimvwdukpgvkifkfpa.supabase.co';
      }
    }

    console.log('[Serve Widget] App URL:', appUrl);

    // Generate the loader script that loads the full widget bundle
    const loaderScript = `
(function() {
  'use strict';
  
  var currentScript = document.currentScript;
  if (!currentScript || !currentScript.hasAttribute('data-agent-id')) {
    return;
  }
  
  var config = {
    agentId: currentScript.getAttribute('data-agent-id'),
    position: currentScript.getAttribute('data-position') || 'bottom-right',
    primaryColor: currentScript.getAttribute('data-primary-color') || '#3b82f6',
    appUrl: '${appUrl}',
  };
  
  var script = document.createElement('script');
  script.src = config.appUrl + '/chatpad-widget.js';
  script.async = true;
  script.setAttribute('data-agent-id', config.agentId);
  script.setAttribute('data-position', config.position);
  script.setAttribute('data-primary-color', config.primaryColor);
  script.setAttribute('data-app-url', config.appUrl);
  document.head.appendChild(script);
})();
`;

    return new Response(
      loaderScript,
      { 
        headers: corsHeaders,
        status: 200,
      }
    )
  } catch (error) {
    console.error('[Serve Widget] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to serve widget loader' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
