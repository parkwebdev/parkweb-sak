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
    
    // Serve a loader script that loads the widget from the deployed app
    const loaderScript = `
(function() {
  console.log('[ChatPad Widget] Loading widget...');
  
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
  
  // Fetch widget configuration
  var configUrl = 'https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/get-widget-config?agentId=' + agentId;
  
  fetch(configUrl)
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Failed to load widget config: ' + response.statusText);
      }
      return response.json();
    })
    .then(function(config) {
      console.log('[ChatPad Widget] Config loaded, initializing widget...');
      
      // Merge config with script attributes
      var widgetConfig = {
        agentId: agentId,
        userId: config.userId || '',
        primaryColor: primaryColor || config.primaryColor || '#000000',
        position: position,
        greeting: config.greeting,
        placeholder: config.placeholder,
        agentName: config.agentName,
        avatarUrl: config.avatarUrl,
        showBranding: config.showBranding,
        animation: config.animation,
        buttonAnimation: config.buttonAnimation || config.animation,
        showBadge: config.showBadge,
        displayTiming: config.displayTiming,
        delaySeconds: config.delaySeconds,
        scrollDepth: config.scrollDepth,
        showTeaser: config.showTeaser,
        teaserText: config.teaserText,
        teaserMessage: config.teaserMessage || config.teaserText,
        welcomeEmoji: config.welcomeEmoji,
        welcomeTitle: config.welcomeTitle,
        welcomeSubtitle: config.welcomeSubtitle,
        quickActions: config.quickActions,
        showBottomNav: config.showBottomNav,
        enableHomeTab: config.enableHomeTab,
        enableMessagesTab: config.enableMessagesTab,
        enableHelpTab: config.enableHelpTab,
        useGradientHeader: config.useGradientHeader,
        gradientStartColor: config.gradientStartColor,
        gradientEndColor: config.gradientEndColor,
        showTeamAvatars: config.showTeamAvatars,
        teamAvatarUrls: config.teamAvatarUrls,
        maxFileSize: config.maxFileSize,
        allowedFileTypes: config.allowedFileTypes,
        enableVoiceMessages: config.enableVoiceMessages,
        enableFileAttachments: config.enableFileAttachments,
        enableMessageReactions: config.enableMessageReactions,
        showReadReceipts: config.showReadReceipts,
        enableContactForm: config.enableContactForm,
        contactFormTitle: config.contactFormTitle,
        contactFormSubtitle: config.contactFormSubtitle,
        customFields: config.customFields,
        viewTransition: config.viewTransition,
        defaultSoundEnabled: config.defaultSoundEnabled,
        defaultAutoScroll: config.defaultAutoScroll,
        announcements: config.announcements || [],
        helpArticles: config.helpArticles,
        helpCategories: config.helpCategories
      };
      
      // Initialize the widget by loading it from the main app
      var widgetFrame = document.createElement('iframe');
      widgetFrame.id = 'chatpad-widget-frame';
      
      // Start with small size for bubble only with fade-in animation
      widgetFrame.style.cssText = 'position: fixed; bottom: 20px; ' + 
        (position.includes('right') ? 'right: 20px;' : 'left: 20px;') + 
        ' width: 60px; height: 60px; border: none; z-index: 999999; ' +
        'background: transparent; display: none; opacity: 0; ' +
        'transition: opacity 0.3s ease-in-out, width 0.3s ease, height 0.3s ease, ' +
        'border-radius 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;';
      
      // Listen for widget state messages to resize iframe
      window.addEventListener('message', function(event) {
        if (event.data.type === 'chatpad-widget-state') {
          if (event.data.isOpen) {
            // Widget opened - expand to full size
            widgetFrame.style.width = '400px';
            widgetFrame.style.height = '650px';
            widgetFrame.style.borderRadius = '16px';
            widgetFrame.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            widgetFrame.style.background = 'white';
          } else {
            // Widget closed - shrink to bubble size
            widgetFrame.style.width = '60px';
            widgetFrame.style.height = '60px';
            widgetFrame.style.borderRadius = '50%';
            widgetFrame.style.boxShadow = 'none';
            widgetFrame.style.background = 'transparent';
          }
        }
      });
      
      // Store config for widget access
      window.chatpadWidgetConfig = widgetConfig;
      
      // Load widget UI from the app using the /widget route
      widgetFrame.src = '${appUrl}/widget?agentId=' + agentId + '&position=' + position;
      
      // Handle display timing with smooth fade-in animation
      function showWidget() {
        // Set initial opacity to 0 for fade-in effect
        widgetFrame.style.opacity = '0';
        widgetFrame.style.display = 'block';
        
        // Trigger fade-in animation
        setTimeout(function() {
          widgetFrame.style.opacity = '1';
        }, 50);
        
        if (widgetConfig.displayTiming === 'immediate') {
          // Already handled above
        } else if (widgetConfig.displayTiming === 'delayed') {
          widgetFrame.style.display = 'none';
          widgetFrame.style.opacity = '0';
          setTimeout(function() {
            widgetFrame.style.display = 'block';
            setTimeout(function() {
              widgetFrame.style.opacity = '1';
            }, 50);
          }, (widgetConfig.delaySeconds || 3) * 1000);
        } else if (widgetConfig.displayTiming === 'scroll') {
          widgetFrame.style.display = 'none';
          widgetFrame.style.opacity = '0';
          var scrollHandler = function() {
            var scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrolled >= (widgetConfig.scrollDepth || 50)) {
              widgetFrame.style.display = 'block';
              setTimeout(function() {
                widgetFrame.style.opacity = '1';
              }, 50);
              window.removeEventListener('scroll', scrollHandler);
            }
          };
          window.addEventListener('scroll', scrollHandler);
        }
      }
      
      document.body.appendChild(widgetFrame);
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showWidget);
      } else {
        showWidget();
      }
      
      console.log('[ChatPad Widget] Widget initialized successfully');
    })
    .catch(function(error) {
      console.error('[ChatPad Widget] Failed to initialize:', error);
    });
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
